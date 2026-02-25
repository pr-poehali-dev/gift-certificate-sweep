"""Создание платежа через Альфа-Банк эквайринг (register.do)"""
import json
import os
import uuid
import urllib.request
import urllib.error
import urllib.parse

ALFA_API = "https://pay.alfabank.ru/payment/rest"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
}


def alfa_request(endpoint, params):
    login = os.environ.get("ALFA_MERCHANT_LOGIN", "")
    password = os.environ.get("ALFA_MERCHANT_PASSWORD", "")
    print(f"=== AUTH: login='{login}' password_len={len(password)} first3='{password[:3]}' ===")
    params["userName"] = login
    params["password"] = password

    url = f"{ALFA_API}/{endpoint}"
    body = urllib.parse.urlencode(params).encode("utf-8")

    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8") if e.fp else ""
        return {"errorCode": str(e.code), "errorMessage": err}
    except Exception as e:
        return {"errorCode": "500", "errorMessage": str(e)}


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
    """Регистрация заказа в Альфа-Банке и получение ссылки на оплату"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}

    body = parse_body(event)
    nominal = body.get("nominal", 0)
    recipient_name = body.get("recipientName", "").strip()
    sender_name = body.get("senderName", "").strip()
    return_url = body.get("returnUrl", "").strip()

    if not nominal or nominal < 500:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Минимальная сумма 500 ₽"})}

    if not recipient_name:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Укажите имя получателя"})}

    if not return_url:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "returnUrl обязателен"})}

    order_number = f"SG-{uuid.uuid4().hex[:12]}"
    amount_kopecks = int(nominal * 100)

    description = f"Подарочный сертификат Sweep GIFT на {nominal} руб."
    if recipient_name:
        description += f" для {recipient_name}"

    order_params = json.dumps({
        "recipientName": recipient_name,
        "senderName": sender_name,
        "nominal": nominal,
    })

    result = alfa_request("register.do", {
        "orderNumber": order_number,
        "amount": str(amount_kopecks),
        "returnUrl": return_url,
        "description": description,
        "jsonParams": order_params,
    })

    print(f"=== register.do order={order_number} amount={amount_kopecks} ===")
    print(json.dumps(result, ensure_ascii=False))

    if result.get("errorCode") and result["errorCode"] != "0":
        return {
            "statusCode": 502,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Ошибка создания платежа", "details": result.get("errorMessage", "")}),
        }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({
            "orderId": result.get("orderId", ""),
            "formUrl": result.get("formUrl", ""),
            "orderNumber": order_number,
        }),
    }