import tinytuya
import time
import os
from dotenv import load_dotenv

load_dotenv()

DEVICE_ID = os.getenv("DEVICE_ID")
IP_ADDRESS = os.getenv("IP_ADDRESS")
LOCAL_KEY  = os.getenv("LOCAL_KEY")

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# Known mode bytes so far (second byte in the 5-byte payload):
# 01 = AQEAAQA= → work_smooth  (flatten)
# 02 = AQIAAQA= → work_empty   (empty/dump)
# 03 = AQMAAQA= → cat_near     (???)
# Trying 04 onwards to find work_mclean (clean)

# Base64 for modes 04–12 on DP 106
# Pattern: AQ[mode]AAQA=  where mode is base64 of [01 XX 00 01 00]
candidates = [
    ("AQQAAQA=", "mode 04"),
    ("AQUAAQA=", "mode 05"),
    ("AQYAAQA=", "mode 06"),
    ("AQcAAQA=", "mode 07"),
    ("AQgAAQA=", "mode 08"),
    ("AQkAAQA=", "mode 09"),
    ("AQoAAQA=", "mode 10"),
    ("AQsAAQA=", "mode 11"),
    ("AQwAAQA=", "mode 12"),
]

TARGET = "work_mclean"

def get_state():
    s = device.status()
    d = s.get("dps", {})
    return d.get("116", "?"), d.get("112", "?")

def wait_for_idle(timeout=25):
    print("  Waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        state, _ = get_state()
        if state == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

print("=== Clean Mode Finder (continuing from mode 04) ===")
print("Watching DP 116 for: 'work_mclean'\n")

state, weight = get_state()
print(f"Current state → DP 116: {state}  |  DP 112: {weight}\n")

for payload, label in candidates:
    print(f"[DP 106 {label}] Payload: {payload}")
    try:
        device.set_value("106", payload)
    except Exception as e:
        print(f"  Error: {e}")
        continue

    time.sleep(3)
    state, weight = get_state()
    print(f"  DP 116: {state}  |  DP 112: {weight}")

    if state == TARGET:
        print(f"\n✅ CLEAN command found!")
        print(f"   DP      : 106")
        print(f"   Payload : {payload}")
        print(f"   Label   : {label}")
        break
    else:
        print(f"  → not clean ({state}), waiting for idle...")
        wait_for_idle()

else:
    print("\n⚠️  work_mclean not found in modes 04–12.")
