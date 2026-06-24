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

TARGET_STATE = "work_mclean"

def get_dps():
    s = device.status()
    return s.get("dps", {})

def get_state():
    d = get_dps()
    return d.get("116", "?"), d.get("112", "?")

def wait_for_idle(timeout=20):
    print("  Waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        state, _ = get_state()
        if state == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

def check_result(label, dp_str, value):
    time.sleep(3)
    state, weight = get_state()
    print(f"  DP 116: {state}  |  DP 112: {weight}")
    if state == TARGET_STATE:
        print(f"\n🎯 CLEAN TRIGGERED!")
        print(f"   DP      : {dp_str}")
        print(f"   Value   : {value}")
        print(f"   State   : {state}")
        return True
    return False

print("=== Pawbby Manual Clean Finder ===")
print(f"Target state on DP 116: '{TARGET_STATE}'\n")

state, weight = get_state()
print(f"Starting state → DP 116: {state}  |  DP 112: {weight}\n")

# ──────────────────────────────────────────────
# STRATEGY 1: Try writing 'work_mclean' directly to DP 116
# ──────────────────────────────────────────────
print("── Strategy 1: Write 'work_mclean' directly to DP 116 ──")
try:
    device.set_value("116", "work_mclean")
    if check_result("Direct write", "116", "work_mclean"):
        exit()
except Exception as e:
    print(f"  Error: {e}")
wait_for_idle()

# ──────────────────────────────────────────────
# STRATEGY 2: Try base64 payloads on DP 106
# (clean is likely a different payload than flatten AQEAAQA=)
# ──────────────────────────────────────────────
print("\n── Strategy 2: Base64 payloads on DP 106 (watching for work_mclean) ──")
payloads_106 = [
    # AQEAAQA= = work_smooth (flatten)  — SKIP
    # AQIAAQA= = work_empty  (dump)     — SKIP
    # AQMAAQA= = cat_near               — SKIP
    "AQQAAQA=",  # mode 04
    "AQUAAQA=",  # mode 05
    "AQYAAQA=",  # mode 06
    "AQcAAQA=",  # mode 07
    "AQgAAQA=",  # mode 08
    "AQkAAQA=",  # mode 09
    "AQoAAQA=",  # mode 10
]
for payload in payloads_106:
    print(f"[DP 106] Payload: {payload}")
    try:
        device.set_value("106", payload)
        if check_result("DP 106", "106", payload):
            exit()
    except Exception as e:
        print(f"  Error: {e}")
    wait_for_idle()

# ──────────────────────────────────────────────
# STRATEGY 3: Try DP 107-110 with the flatten payload
# (clean may be on a different command DP entirely)
# ──────────────────────────────────────────────
print("\n── Strategy 3: DP 107-110 with base64 payload ──")
for dp_id in [107, 108, 109, 110]:
    dp_str = str(dp_id)
    payload = "AQEAAQA="
    print(f"[DP {dp_str}] Payload: {payload}")
    try:
        device.set_value(dp_str, payload)
        if check_result(f"DP {dp_str}", dp_str, payload):
            exit()
    except Exception as e:
        print(f"  Error: {e}")
    wait_for_idle()

# ──────────────────────────────────────────────
# STRATEGY 4: Try integer values on DP 106 (some Tuya devices use int mode selectors)
# ──────────────────────────────────────────────
print("\n── Strategy 4: Integer mode selectors on DP 106 ──")
for val in [1, 2, 3, 4, 5]:
    print(f"[DP 106] Integer: {val}")
    try:
        device.set_value("106", val)
        if check_result("DP 106 int", "106", val):
            exit()
    except Exception as e:
        print(f"  Error: {e}")
    wait_for_idle()

print("\n⚠️  Could not trigger 'work_mclean' remotely.")
print("The app may be using a cloud API call rather than a local DP write.")
