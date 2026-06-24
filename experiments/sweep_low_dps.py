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

TARGET = "work_mclean"

# Known safe DPs to skip (sensors/status)
SKIP = {111, 112, 113, 114, 115, 116, 117}

def get_state():
    s = device.status()
    return s.get("dps", {}).get("116", "?")

def wait_for_idle(timeout=25):
    print("  → waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        if get_state() == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

def try_dp(dp, value, label, watch=6):
    print(f"  [DP {dp:>3}] {label}", end=" ... ", flush=True)
    try:
        device.set_value(str(dp), value)
    except Exception as e:
        print(f"err: {e}")
        return False

    for _ in range(watch * 2):
        state = get_state()
        if state == TARGET:
            print(f"\n🎯 FOUND! DP={dp} value={value!r}")
            return True
        time.sleep(0.5)

    state = get_state()
    print(f"{state}")
    return False

print("=== Sweeping DPs 1–99 for work_mclean ===\n")
print(f"Current state: {get_state()}\n")

# Payloads to try per DP — in order of likelihood
payloads = [
    ("AQEAAQA=", "flatten-payload"),   # mode 01
    ("AQMAAQA=", "mode-03"),           # mode 03
    (True,       "bool True"),
    (1,          "int 1"),
]

for dp in range(1, 100):
    if dp in SKIP:
        continue

    found = False
    for value, label in payloads:
        if try_dp(dp, value, label):
            print(f"\n✅ CLEAN command found!")
            print(f"   DP    : {dp}")
            print(f"   Value : {value!r}")
            exit()

        state = get_state()
        if state == TARGET:
            exit()
        if state not in ("work_idle", "work_smooth"):
            print(f"  ⚠️  Unexpected state: {state}")
            wait_for_idle()
            break  # Don't try more payloads on this DP if it triggered something

print(f"\n⚠️  '{TARGET}' not found in DPs 1–99.")
print("Exhausted all local DP options — may require Tuya Cloud API.")
