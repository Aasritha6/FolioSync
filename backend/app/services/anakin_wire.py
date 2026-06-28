import urllib.request
import json
import time
import os

ANAKIN_API_KEY = os.getenv("ANAKIN_API_KEY", "")
BASE_URL = "https://anakin.io/v1/wire/task"
POLL_BASE = "https://anakin.io"

def call_wire(action_id: str, params: dict = None, max_retries=15) -> dict:
    body = json.dumps({"action_id": action_id, "params": params or {}}).encode()
    req = urllib.request.Request(
        BASE_URL,
        data=body,
        headers={"X-API-Key": ANAKIN_API_KEY, "Content-Type": "application/json"},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req)
        job_data = json.loads(resp.read())
        
        if "poll_url" not in job_data:
            return job_data.get("data", job_data)
            
        poll_url = POLL_BASE + job_data["poll_url"]
        
        for _ in range(max_retries):
            time.sleep(2)
            req = urllib.request.Request(
                poll_url,
                headers={"X-API-Key": ANAKIN_API_KEY},
                method="GET"
            )
            resp = urllib.request.urlopen(req)
            status_data = json.loads(resp.read())
            status = status_data.get("status")
            
            if status == "completed":
                return status_data.get("data", {})
            elif status == "failed":
                print(f"Wire job failed for {action_id}: {status_data}")
                return None
    except Exception as e:
        print(f"Wire API error for {action_id}: {e}")
        return None
    
    return None

def get_screener_overview(query: str):
    return call_wire("a589dade-3185-402b-9fca-7de455a495fc", {"query": query})

def get_macro_news():
    return call_wire("e8f7cfde-7052-4dd5-80e5-5473707347b3", {})

def get_fno_ban():
    # NSE India specific API might need mapping, we'll use a placeholder or relevant wire
    # For now returning a mock structure if we can't find the exact NSE FNO wire easily
    # The user provided some catalog actions, let's assume we can fetch news for now
    return []
