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

# Known payload structure: [01][mode][00][01][00]
# Confirmed:
#   01 01 00 01 00 = AQEAAQA= → work_smooth  (flatten)
#   01 02 00 01 00 = AQIAAQA= → work_empty   (dump)    ← SKIP
#   01 03 00 01 00 = AQMAAQA= → cat_near               ← SKIP
#   01 04 00 01 00 = AQQAAQA= → cat_near_leave         ← SKIP
#   01 05–12       → work_idle (no effect)
#
# New strategy: keep mode=01 (flatten-like), vary the OTHER bytes
# to see if clean is a sub-mode of the flatten command.

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

def try_payload(dp, payload_bytes, label):
    payload_b64 = base64.b64encode(bytes(payload_bytes)).decode()
    print(f"[DP {dp} | {label}] {payload_bytes} → {payload_b64}")
    try:
        device.set_value(str(dp), payload_b64)
    except Exception as e:
        print(f"  Error: {e}")
        return False
    time.sleep(3)
    state, weight = get_state()
    print(f"  DP 116: {state}  |  DP 112: {weight}")
    if state == TARGET:
        print(f"\n✅ CLEAN found! DP={dp}  Payload={payload_b64}  Bytes={payload_bytes}")
        return True
    if state not in ("work_idle",):
        print(f"  ⚠️  Unexpected state: {state}")
    wait_for_idle()
    return False

print("=== Clean Mode Deep Finder ===")
print(f"Target: '{TARGET}' on DP 116\n")
state, weight = get_state()
print(f"Start → DP 116: {state}  |  DP 112: {weight}\n")

# ── Section A: Vary byte[2] (sub-command), keep mode=01 ──
print("── A: Vary byte[2] (sub-command), mode=01 ──")
for b2 in [1, 2, 3, 4]:
    if try_payload(106, [0x01, 0x01, b2, 0x01, 0x00], f"b2={b2}"):
        exit()

# ── Section B: Vary byte[3] (parameter), keep mode=01 ──
print("\n── B: Vary byte[3] (parameter), mode=01 ──")
for b3 in [0, 2, 3, 4]:
    if try_payload(106, [0x01, 0x01, 0x00, b3, 0x00], f"b3={b3}"):
        exit()

# ── Section C: Vary byte[4] (last byte), keep mode=01 ──
print("\n── C: Vary byte[4] (last byte), mode=01 ──")
for b4 in [1, 2, 3]:
    if try_payload(106, [0x01, 0x01, 0x00, 0x01, b4], f"b4={b4}"):
        exit()

# ── Section D: Try DPs 107–110 with True / 1 / 0 ──
print("\n── D: DPs 107–110 with boolean/integer values ──")
for dp in [107, 108, 109, 110]:
    for val, label in [(True, "True"), (1, "int 1"), (0, "int 0")]:
        print(f"[DP {dp}] Sending {label}...")
        try:
            device.set_value(str(dp), val)
        except Exception as e:
            print(f"  Error: {e}")
            continue
        time.sleep(3)
        state, weight = get_state()
        print(f"  DP 116: {state}  |  DP 112: {weight}")
        if state == TARGET:
            print(f"\n✅ CLEAN found! DP={dp}  Value={val}")
            exit()
        if state not in ("work_idle",):
            print(f"  ⚠️  Unexpected: {state}")
        wait_for_idle()

print(f"\n⚠️  '{TARGET}' not found. The clean command may require app-level cloud routing.")
