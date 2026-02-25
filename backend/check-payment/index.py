"""Проверка статуса оплаты Альфа-Банк + создание сертификата в Prime Hill"""
import json
import os
import uuid
import random
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

ALFA_API = "https://pay.alfabank.ru/payment/rest"
PRIME_HILL_BASE = "https://open-api.p-h.app/api/v2"
TEMPLATE_ID = 15852

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
}


def alfa_request(endpoint, params):
    token = os.environ.get("ALFA_MERCHANT_TOKEN", "")
    if token:
        params["token"] = token
    else:
        params["userName"] = os.environ.get("ALFA_MERCHANT_LOGIN", "")
        params["password"] = os.environ.get("ALFA_MERCHANT_PASSWORD", "")
    url = f"{ALFA_API}/{endpoint}"
    body = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8") if e.fp else ""
        return {"errorCode": str(e.code), "errorMessage": err}
    except Exception as e:
        return {"errorCode": "500", "errorMessage": str(e)}


def ph_request(method, endpoint, data=None, params=None):
    token = os.environ.get("PRIME_HILL_API_KEY", "")
    if params is None:
        params = {}
    params["token"] = token
    query_string = urllib.parse.urlencode(params)
    url = f"{PRIME_HILL_BASE}/{endpoint}?{query_string}"
    req_body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_body, method=method, headers={"Content-Type": "application/json"} if req_body else {})
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


def create_certificate(recipient_name, sender_name, nominal):
    name_parts = recipient_name.split(" ", 2)
    first_name = name_parts[0] if len(name_parts) > 0 else recipient_name
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    patronymic = name_parts[2] if len(name_parts) > 2 else ""

    create_result = ph_request("POST", "createClients", data={
        "clients": [{
            "lastName": last_name if last_name else "Сертификат",
            "firstName": first_name,
            "patronymic": patronymic if patronymic else "",
            "birthday": "2000-01-01",
            "sex": 0,
            "email": "",
            "phone": "7" + str(random.randint(9000000000, 9999999999)),
            "templateId": TEMPLATE_ID,
            "cardNumber": "",
            "cardBarcode": "",
            "comment": f"Сертификат Sweep GIFT на {nominal} руб." + (f" от {sender_name}" if sender_name else ""),
            "parent": 0,
            "tags": [],
        }]
    })
    print("=== createClients response ===")
    print(json.dumps(create_result, ensure_ascii=False))

    if not create_result.get("ok"):
        return None, "Ошибка создания клиента в Prime Hill"

    clients_list = create_result.get("data", {}).get("response", [])
    if not clients_list:
        return None, "Prime Hill не вернул данные клиента"

    client = clients_list[0]
    client_id = client.get("clientId", 0)
    card_number = client.get("cardNumber", "")
    card_barcode = client.get("cardBarcode", "")
    card_hash = client.get("hash", "")

    order_guid = str(uuid.uuid4()).replace("-", "")[:16]
    deposit_result = ph_request("POST", "createOrder", data={
        "guid": order_guid,
        "number": f"SG-{order_guid[:8]}",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sum": 0,
        "sumDiscount": 0,
        "bonusAdd": 0,
        "bonusWriteOff": 0,
        "depositAdd": float(nominal),
        "depositWriteOff": 0,
        "cart": [{
            "name": f"Подарочный сертификат {nominal} руб.",
            "nid": order_guid,
            "groupId": "certificates",
            "groupName": "Сертификаты",
            "price": float(nominal),
            "priceWithDiscount": float(nominal),
            "amount": 1,
        }],
    }, params={"type": "clientId", "id": str(client_id)})
    print("=== createOrder response ===")
    print(json.dumps(deposit_result, ensure_ascii=False))

    return {
        "clientId": str(client_id),
        "cardNumber": str(card_number),
        "cardBarcode": str(card_barcode),
        "cardHash": card_hash,
        "recipientName": recipient_name,
        "senderName": sender_name,
        "nominal": nominal,
        "qrUrl": str(card_number),
    }, None


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
    """Проверка оплаты через Альфа-Банк и создание сертификата после успешной оплаты"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}

    body = parse_body(event)
    order_id = body.get("orderId", "").strip()

    if not order_id:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "orderId обязателен"})}

    status_result = alfa_request("getOrderStatusExtended.do", {"orderId": order_id})
    print("=== getOrderStatusExtended ===")
    print(json.dumps(status_result, ensure_ascii=False))

    order_status = status_result.get("orderStatus", -1)
    action_code = status_result.get("actionCode", -1)

    if order_status != 2 or action_code != 0:
        status_text = {0: "Зарегистрирован", 1: "Удержана", 2: "Оплачен", 3: "Отменён", 4: "Возврат", 5: "По ACS", 6: "Отклонён"}.get(order_status, "Неизвестен")
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "paid": False,
                "orderStatus": order_status,
                "statusText": status_text,
                "actionCodeDescription": status_result.get("actionCodeDescription", ""),
            }),
        }

    merchant_params = {}
    json_params = status_result.get("merchantOrderParams", [])
    for p in json_params:
        merchant_params[p.get("name", "")] = p.get("value", "")

    jp = status_result.get("orderDescription", "")
    try:
        order_data = json.loads(merchant_params.get("jsonParams", "{}"))
    except Exception:
        order_data = {}

    recipient_name = order_data.get("recipientName", "")
    sender_name = order_data.get("senderName", "")
    nominal = order_data.get("nominal", 0)
    amount = status_result.get("amount", 0)

    if not nominal and amount:
        nominal = amount // 100

    if not recipient_name:
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"paid": True, "error": "Не удалось получить данные получателя из заказа"}),
        }

    certificate, error = create_certificate(recipient_name, sender_name, nominal)

    if error:
        return {
            "statusCode": 502,
            "headers": CORS_HEADERS,
            "body": json.dumps({"paid": True, "error": error}),
        }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({
            "paid": True,
            "success": True,
            "certificate": certificate,
        }),
    }