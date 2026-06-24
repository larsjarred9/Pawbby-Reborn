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
    print("  Waiting for idle...", end="", flush=True)
    for _ in range(timeout * 2):
        state, _ = get_state()
        if state == "work_idle":
            print(" ✅")
            return
        time.sleep(0.5)
    print(" timed out.")

def try_and_watch(dp, value, label, watch_seconds=10):
    """Send a command and watch DP 116 for up to watch_seconds."""
    print(f"[DP {dp} | {label}] value={value!r}")
    try:
        device.set_value(str(dp), value)
    except Exception as e:
        print(f"  Error: {e}")
        return False

    print(f"  Watching for {watch_seconds}s...", end="", flush=True)
    for _ in range(watch_seconds * 2):
        state, weight = get_state()
        if state == TARGET:
            print(f"\n  🎯 {TARGET} FOUND!")
            print(f"     DP={dp}  value={value!r}")
            return True
        if state not in ("work_idle", "work_smooth"):
            print(f"\n  ⚠️  State: {state}  weight: {weight}")
        time.sleep(0.5)

    state, weight = get_state()
    print(f" done. DP 116={state}")
    return False

print("=== Targeted work_mclean Hunt ===\n")
state, weight = get_state()
print(f"Start → DP 116: {state}  |  DP 112: {weight}\n")

# ── Round 1: retry AQMAAQA= (mode 03) with longer watch ──────────────────────
# Previously triggered 'cat_near' after only 3s — maybe work_mclean comes after
print("── Round 1: AQMAAQA= (mode 03) on DP 106, longer watch ──")
if try_and_watch(106, "AQMAAQA=", "mode 03", watch_seconds=15):
    exit()
wait_for_idle()

# ── Round 2: try DPs 118–135 with base64 payloads ────────────────────────────
print("\n── Round 2: DPs 118–135 with base64 payloads ──")
SKIP = {111, 112, 113, 114, 115, 116, 117}
for dp_id in range(118, 136):
    if dp_id in SKIP:
        continue
    if try_and_watch(dp_id, "AQEAAQA=", f"flatten payload", watch_seconds=5):
        exit()
    state, _ = get_state()
    if state != "work_idle":
        wait_for_idle()

# ── Round 3: try string enum "work_mclean" on DPs 106, 116, 118–125 ──────────
print("\n── Round 3: string 'work_mclean' on various DPs ──")
for dp_id in [106, 116, 118, 119, 120, 121]:
    if try_and_watch(dp_id, "work_mclean", "string enum", watch_seconds=5):
        exit()
    state, _ = get_state()
    if state != "work_idle":
        wait_for_idle()

# ── Round 4: try integer mode 03 on DP 106 ───────────────────────────────────
print("\n── Round 4: integer values on DP 106 ──")
for val in [3, 4, 5, 6]:
    if try_and_watch(106, val, f"int {val}", watch_seconds=5):
        exit()
    state, _ = get_state()
    if state != "work_idle":
        wait_for_idle()

print(f"\n⚠️  '{TARGET}' not found in this round.")
print("Consider: manual clean may require Tuya Cloud API, not local DP write.")
