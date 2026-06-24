import tinytuya
import base64
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
    return s.get("dps", {}).get("116", "?")

def wait_for_idle(timeout=30):
    print("  waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        if get_state() == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

def try_payload(payload_bytes, watch=8):
    b64 = base64.b64encode(bytes(payload_bytes)).decode()
    print(f"  {list(payload_bytes)} → {b64}", end=" → ", flush=True)
    try:
        device.set_value("106", b64)
    except Exception as e:
        print(f"Error: {e}")
        return False
    for _ in range(watch * 2):
        state = get_state()
        if state == TARGET:
            print(f"\n🎯 {TARGET} TRIGGERED! payload={b64}")
            return True
        time.sleep(0.5)
    state = get_state()
    print(state)
    return False

print("=== DP 106 Extended Mode Sweep (modes 13–30) ===")
print(f"Start: {get_state()}\n")

# We tested modes 01–12 before. All above 04 returned work_idle.
# Now trying 13–30 — maybe mclean is encoded differently.
print("── Modes 13–30 on DP 106 ──")
for mode in range(13, 31):
    payload = [0x01, mode, 0x00, 0x01, 0x00]
    if try_payload(payload):
        exit()
    state = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

# Also try mode 03 but with byte[4] = 0x04 (matching DP 101 current value)
print("\n── Mode 03 variants (different last bytes) ──")
for last_byte in [0x02, 0x03, 0x04, 0x05]:
    payload = [0x01, 0x03, 0x00, 0x01, last_byte]
    if try_payload(payload):
        exit()
    state = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

print(f"\n⚠️  '{TARGET}' not found in extended mode sweep.")
