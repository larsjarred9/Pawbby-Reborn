import tinytuya
import time
import os
import base64
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
    return s.get("dps", {}).get("116", "?")

def wait_for_idle(timeout=30):
    print("  Waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        if get_state() == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

def try_dp(dp, value, label, watch=10):
    print(f"[DP {dp} | {label}] value={value!r}", end=" → ", flush=True)
    try:
        device.set_value(str(dp), value)
    except Exception as e:
        print(f"Error: {e}")
        return False
    for _ in range(watch * 2):
        state = get_state()
        if state == TARGET:
            print(f"\n🎯🎯🎯 {TARGET} TRIGGERED!")
            print(f"   DP    : {dp}")
            print(f"   Value : {value!r}")
            return True
        time.sleep(0.5)
    state = get_state()
    print(state)
    return False

print("=== DP 102 Targeted Clean Trigger ===")
print(f"Start state: {get_state()}\n")

# DP 102 broadcasted 'AQAACwAAAAAAAAAAAAAA' after a manual clean completed.
# Decoded bytes: 01 00 00 0B 00 00 00 00 00 00 00 00 00 00 00
# Byte[3] = 0x0B = 11 (likely a counter/cycle count, not part of the trigger)
# Let's try stripped-down versions of this payload as the trigger command.

dp102_candidates = [
    # Exact value seen broadcast after clean
    ("AQAACwAAAAAAAAAAAAAA", "exact broadcast value"),
    # Zeroed counter (byte[3] = 0)
    (base64.b64encode(bytes([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])).decode(), "zeroed counter"),
    # Short 5-byte version (like DP 106 format)
    ("AQEAAQA=", "5-byte flatten format"),
    ("AQMAAQA=", "5-byte mode-03"),
    # Simple values
    (True,  "bool True"),
    (1,     "int 1"),
    (0,     "int 0"),
]

print("── Testing DP 102 ──")
for value, label in dp102_candidates:
    if try_dp(102, value, label):
        exit()
    state = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

# Also try DP 101 and DP 103 (neighbors of 102) with same candidates
print("\n── Testing DP 101 (neighbor) ──")
for value, label in dp102_candidates[:4]:
    if try_dp(101, value, label):
        exit()
    state = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

print("\n── Testing DP 103 (neighbor) ──")
for value, label in dp102_candidates[:4]:
    if try_dp(103, value, label):
        exit()
    state = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

print(f"\n⚠️  '{TARGET}' not found via DP 102.")
print("DP 102 may be a reporting/result DP (written BY device after clean, not the trigger).")
