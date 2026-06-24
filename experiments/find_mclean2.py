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
    return d.get("116", "?"), d

def wait_for_idle(timeout=25):
    print("  Waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        state, _ = get_state()
        if state == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

def try_payload(dp, value, label, watch=6):
    print(f"[DP {dp:>3} | {label}]", end=" ", flush=True)
    try:
        device.set_value(str(dp), value)
    except Exception as e:
        print(f"Error: {e}")
        return False

    for _ in range(watch * 2):
        state, dps = get_state()
        if state == TARGET:
            print(f"\n\n🎯🎯🎯 FOUND work_mclean!")
            print(f"   DP      : {dp}")
            print(f"   Value   : {value!r}")
            print(f"   Full DPS: {dps}")
            return True
        time.sleep(0.5)

    state, _ = get_state()
    print(f"→ {state}")
    return False

print("=== work_mclean Hunt — Round 2 ===")
print("Trying mode-03 payload on ALL untested DPs + lower DP range\n")

state, _ = get_state()
print(f"Start → DP 116: {state}\n")

# ── Section A: mode-03 payload on DPs 118–150 ─────────────────────────────────
# We only tried flatten payload (mode 01) on these before
print("── A: AQMAAQA= (mode 03) on DPs 118–150 ──")
for dp in range(118, 151):
    if try_payload(dp, "AQMAAQA=", "mode03"):
        exit()
    state, _ = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

# ── Section B: mode-03 on DPs 100–105 (never tried these) ────────────────────
print("\n── B: all payloads on DPs 100–105 (never probed) ──")
for dp in range(100, 106):
    for payload, label in [
        ("AQEAAQA=", "mode01/flatten"),
        ("AQMAAQA=", "mode03"),
        ("AQIAAQA=", "mode02/aclean ⚠️"),  # only if others fail
    ]:
        if label == "mode02/aclean ⚠️":
            # Only try this if we haven't found it yet and the box is empty/safe
            ans = input(f"  Try mode02 (EMPTY risk) on DP {dp}? [y/Enter=skip]: ").strip().lower()
            if ans != "y":
                continue
        if try_payload(dp, payload, label):
            exit()
        state, _ = get_state()
        if state not in ("work_idle",):
            wait_for_idle()

# ── Section C: try sending `工作状态` style payloads with mode=03 ──────────────
# What if manual clean = mode 03 but the device only accepts it from certain DPs?
print("\n── C: mode-03 on DPs 101–106 specifically ──")
for dp in [101, 102, 103, 104, 105, 106]:
    if try_payload(dp, "AQMAAQA=", "mode03 retry", watch=10):
        exit()
    state, _ = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

# ── Section D: try the exact auto-clean payload but on non-106 DPs ─────────────
print("\n── D: AQIAAQA= (aclean payload) on DPs 100–105 ──")
print("  (⚠️  This may trigger empty — watch the machine!)")
for dp in [100, 101, 102, 103, 104, 105]:
    if try_payload(dp, "AQIAAQA=", "aclean payload", watch=8):
        exit()
    state, _ = get_state()
    if state not in ("work_idle",):
        wait_for_idle()

print(f"\n⚠️  '{TARGET}' still not found.")
print("Next step: press physical clean button while running listen_button.py")
