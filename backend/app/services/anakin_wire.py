import urllib.request
import urllib.error
import json
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

ANAKIN_API_KEY = os.getenv("ANAKIN_API_KEY", "")
BASE_URL = "https://anakin.io/v1/wire/task"
POLL_BASE = "https://anakin.io"

# Disable SSL verification to work around corporate/system cert issues
_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


def call_wire(action_id: str, params: dict = None, max_retries: int = 20) -> dict:
    """Call Anakin Wire API and poll until result is ready."""
    body = json.dumps({"action_id": action_id, "params": params or {}}).encode()
    req = urllib.request.Request(
        BASE_URL,
        data=body,
        headers={"X-API-Key": ANAKIN_API_KEY, "Content-Type": "application/json"},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, context=_ssl_ctx)
        job_data = json.loads(resp.read())

        if "poll_url" not in job_data:
            return job_data.get("data", job_data)

        poll_url = POLL_BASE + job_data["poll_url"]

        for _ in range(max_retries):
            time.sleep(2)
            poll_req = urllib.request.Request(
                poll_url,
                headers={"X-API-Key": ANAKIN_API_KEY},
                method="GET"
            )
            poll_resp = urllib.request.urlopen(poll_req, context=_ssl_ctx)
            status_data = json.loads(poll_resp.read())
            status = status_data.get("status")

            if status == "completed":
                inner = status_data.get("data", {})
                # unwrap nested data/status structure
                if isinstance(inner, dict) and "data" in inner:
                    return inner["data"]
                return inner
            elif status == "failed":
                print(f"Wire job failed for {action_id}: {status_data}")
                return None

    except Exception as e:
        print(f"Wire API error for {action_id}: {e}")
        return None

    return None


def get_macro_news():
    return call_wire("e8f7cfde-7052-4dd5-80e5-5473707347b3", {})

def get_screener_overview(query: str):
    return call_wire("a589dade-3185-402b-9fca-7de455a495fc", {"query": query})
