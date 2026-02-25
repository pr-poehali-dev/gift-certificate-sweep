"""Создание электронного сертификата через Prime Hill Open API v2"""
import json
import os
import uuid
import random
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

PRIME_HILL_BASE = "https://open-api.p-h.app/api/v2"
TEMPLATE_ID = 15852

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
}


def ph_request(method, endpoint, data=None, params=None):
    token = os.environ.get("PRIME_HILL_API_KEY", "")
    if params is None:
        params = {}
    params["token"] = token

    query_string = urllib.parse.urlencode(params)
    url = f"{PRIME_HILL_BASE}/{endpoint}?{query_string}"

    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(
        url, data=body, method=method,
        headers={"Content-Type": "application/json"} if body else {},
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return {"ok": True, "status": resp.status, "data": json.loads(raw) if raw else {}}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8") if e.fp else ""
        try:
            err = json.loads(err)
        except Exception:
            pass
        return {"ok": False, "status": e.code, "error": err}
    except Exception as e:
        return {"ok": False, "status": 500, "error": str(e)}


def parse_body(event):
    raw = event.get("body", "{}")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        parsed = json.loads(raw)
        if isinstance(parsed, str):
            parsed = json.loads(parsed)
        return parsed if isinstance(parsed, dict) else {}
    return {}


def handler(event, context):
    """Создание электронного сертификата: регистрация клиента в Prime Hill + пополнение депозита"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        action = (event.get("queryStringParameters") or {}).get("action", "")

        if action == "ping":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps(ph_request("GET", "ping"))}

        if action == "templates":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps(ph_request("GET", "getTemplates"))}

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"status": "ok", "service": "Sweep GIFT", "actions": ["ping", "templates"]}),
        }

    if method != "POST":
        return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}

    body = parse_body(event)
    recipient_name = body.get("recipientName", "").strip()
    sender_name = body.get("senderName", "").strip()
    nominal = body.get("nominal", 0)
    phone = body.get("phone", "").strip()

    if not recipient_name or not nominal:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "recipientName и nominal обязательны"})}

    if nominal < 500:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Минимальная сумма сертификата 500 ₽"})}

    name_parts = recipient_name.split(" ", 2)
    first_name = name_parts[0] if len(name_parts) > 0 else recipient_name
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    patronymic = name_parts[2] if len(name_parts) > 2 else ""

    rand_phone = phone if phone else "7" + str(random.randint(9000000000, 9999999999))

    client_payload = {
        "clients": [{
            "firstName": first_name,
            "lastName": last_name,
            "patronymic": patronymic,
            "birthday": "2000-01-01",
            "sex": 0,
            "email": "",
            "phone": rand_phone,
            "templateId": TEMPLATE_ID,
            "cardNumber": "",
            "cardBarcode": "",
            "comment": f"Сертификат Sweep GIFT на {nominal} руб." + (f" от {sender_name}" if sender_name else ""),
            "parent": "",
            "tags": [],
        }]
    }
    print("createClients payload:", json.dumps(client_payload))
    create_result = ph_request("POST", "createClients", data=client_payload)
    print("createClients result:", json.dumps(create_result))

    if not create_result.get("ok"):
        return {
            "statusCode": 502,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Ошибка создания клиента в Prime Hill", "details": create_result}),
        }

    api_data = create_result.get("data", {})
    clients = api_data.get("response", [])
    errors = api_data.get("errors", [])

    if not clients or len(clients) == 0:
        return {
            "statusCode": 502,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Prime Hill не вернул данные клиента", "apiErrors": errors, "raw": api_data}),
        }

    client = clients[0]
    print("client object:", json.dumps(client))
    client_id = client.get("clientId", "")
    card_hash = client.get("hash", "")
    card_number = client.get("cardNumber", "")
    card_barcode = client.get("cardBarcode", "")

    order_guid = str(uuid.uuid4()).replace("-", "")[:16]
    order_payload = {
        "guid": order_guid,
        "number": f"SG-{order_guid[:8]}",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "clientId": client_id,
        "sum": 0,
        "sumDiscount": 0,
        "bonusAdd": 0,
        "bonusWriteOff": 0,
        "depositAdd": float(nominal),
        "depositWriteOff": 0,
        "cart": [],
    }
    print("createOrder payload:", json.dumps(order_payload))
    deposit_result = ph_request("POST", "createOrder", data=order_payload)
    print("createOrder result:", json.dumps(deposit_result))

    # QR ведёт на номер карты, а не на установку
    qr_url = str(card_number) if card_number else str(card_barcode)

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({
            "success": True,
            "certificate": {
                "clientId": str(client_id),
                "cardNumber": str(card_number),
                "cardBarcode": str(card_barcode),
                "cardHash": card_hash,
                "recipientName": recipient_name,
                "senderName": sender_name,
                "nominal": nominal,
                "qrUrl": qr_url,
            },
            "depositResult": deposit_result,
        }),
    }