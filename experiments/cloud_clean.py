import tinytuya
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

DEVICE_ID     = os.getenv("DEVICE_ID")
CLIENT_ID     = os.getenv("TUYA_CLIENT_ID")
CLIENT_SECRET = os.getenv("TUYA_CLIENT_SECRET")
REGION        = os.getenv("TUYA_REGION", "eu")

print(f"Connecting to Tuya Cloud ({REGION})...")
c = tinytuya.Cloud(
    apiRegion=REGION,
    apiKey=CLIENT_ID,
    apiSecret=CLIENT_SECRET,
)

def req(path, method="GET", body=None, label=""):
    print(f"\n── {label or path} ──")
    result = c.cloudrequest(path, method, body)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return result

# ── PUT (not POST) for shadow properties ─────────────────────────────────────
req(f"/v2.0/cloud/thing/{DEVICE_ID}/shadow/properties", "PUT",
    {"properties": {"clean_control": "AQMAAQA="}},
    "PUT v2.0 shadow properties (nested)")

req(f"/v2.0/cloud/thing/{DEVICE_ID}/shadow/properties", "PUT",
    {"clean_control": "AQMAAQA="},
    "PUT v2.0 shadow properties (flat body)")

# ── v2.0 iot-03 commands ──────────────────────────────────────────────────────
req(f"/v2.0/iot-03/devices/{DEVICE_ID}/commands", "POST",
    {"commands": [{"code": "clean_control", "value": "AQMAAQA="}]},
    "v2.0 iot-03 commands")

# ── v1.1 commands (between v1.0 and v1.2) ────────────────────────────────────
req(f"/v1.1/devices/{DEVICE_ID}/commands", "POST",
    {"commands": [{"code": "clean_control", "value": "AQMAAQA="}]},
    "v1.1 commands: clean_control mode-03")

# ── v1.0 with correct value format for raw type ──────────────────────────────
# Raw DPs might need the value as hex string, not base64
import base64
hex_val = base64.b64decode("AQMAAQA=").hex()
print(f"\n(hex of AQMAAQA= = {hex_val})")

req(f"/v1.0/devices/{DEVICE_ID}/commands", "POST",
    {"commands": [{"code": "clean_control", "value": hex_val}]},
    "v1.0 commands: clean_control as hex")

# ── Try sending work_mclean directly to data_flag_03 via cloud ────────────────
req(f"/v1.0/devices/{DEVICE_ID}/commands", "POST",
    {"commands": [{"code": "data_flag_03", "value": "work_mclean"}]},
    "v1.0 commands: data_flag_03 = work_mclean")
