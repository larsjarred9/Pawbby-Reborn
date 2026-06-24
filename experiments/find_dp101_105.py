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

def get_state():
    s = device.status()
    d = s.get("dps", {})
    return d.get("116", "?"), d.get("112", "?")

def wait_for_idle(timeout=30):
    print("  waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        state, _ = get_state()
        if state == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

def try_dp(dp, value, label, watch=10):
    print(f"[DP {dp:>3} | {label}]", end=" → ", flush=True)
    try:
        device.set_value(str(dp), value)
    except Exception as e:
        print(f"Error: {e}")
        return False
    for _ in range(watch * 2):
        state, _ = get_state()
        if state == TARGET:
            print(f"\n🎯 {TARGET} TRIGGERED! DP={dp} value={value!r}")
            return True
        time.sleep(0.5)
    state, _ = get_state()
    print(state)
    return False

print("=== DP 101 & 105 Clean Trigger Test ===")
print(f"Schema source: v2.0 Thing Model API")
print(f"Start: {get_state()[0]}\n")

# ── DP 101: work_state (工作状态) — RW, never tried! ──────────────────────────
# Current cloud value: AQAAAQQ= = bytes 01 00 00 01 04
# DP 106 flatten uses:   AQEAAQA= = bytes 01 01 00 01 00 (mode=01)
# DP 106 empty uses:     AQIAAQA= = bytes 01 02 00 01 00 (mode=02)
# Hypothesis: DP 101 uses same format, mode=03 = mclean

print("── DP 101 (work_state) ──")
candidates_101 = [
    ("AQMAAQA=", "mode 03 / mclean?"),
    ("AQEAAQA=", "mode 01 / flatten"),
    ("AQIAAQA=", "mode 02 / aclean?"),
    ("AQAAAQQ=", "echo current value"),
    (True,       "bool True"),
    (1,          "int 1"),
    (3,          "int 3"),
]

for value, label in candidates_101:
    if try_dp(101, value, label):
        exit()
    state, _ = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

# ── DP 105: device_control (设备控制) — RW, never tried! ─────────────────────
print("\n── DP 105 (device_control) ──")
candidates_105 = [
    ("AQMAAQA=", "mode 03 / mclean?"),
    ("AQEAAQA=", "mode 01"),
    ("AQIAAQA=", "mode 02"),
    (True,       "bool True"),
    (1,          "int 1"),
]

for value, label in candidates_105:
    if try_dp(105, value, label):
        exit()
    state, _ = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

print(f"\n⚠️  '{TARGET}' not found via DP 101 or 105.")
