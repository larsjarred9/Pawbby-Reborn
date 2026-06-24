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

# Strategy: trigger work_aclean by sending DP 107 the cat-visit payload.
# The device auto-triggers work_aclean ~70s after DP 107 broadcasts.
# DP 107 = 如厕数据 (toilet data) — broadcasts after every real cat visit.

# Cat visit payload observed: 'AQAABRBQABUA'
CAT_VISIT_PAYLOAD = "AQAABRBQABUA"
WAIT_SECONDS = 90  # device triggers aclean ~70s after cat visit data

def get_state():
    s = device.status()
    return s.get("dps", {}).get("116", "?")

print("=== Trigger Clean via Fake Cat Visit ===")
print(f"Current state: {get_state()}")
print(f"\nSending cat-visit data to DP 107 (payload: {CAT_VISIT_PAYLOAD})...")

try:
    response = device.set_value("107", CAT_VISIT_PAYLOAD)
    print(f"Response: {response}")
except Exception as e:
    print(f"Error: {e}")

print(f"\nWaiting up to {WAIT_SECONDS}s for work_aclean to trigger...")
print("Watching DP 116...\n")

for i in range(WAIT_SECONDS * 2):
    state = get_state()
    elapsed = i * 0.5
    print(f"  [{elapsed:5.1f}s] DP 116 = {state}", end="\r")

    if state in ("work_aclean", "work_mclean"):
        print(f"\n\n🎯 CLEAN TRIGGERED! DP 116 = '{state}' after {elapsed:.0f}s")
        print("✅ Fake cat visit successfully triggered a clean cycle!")
        break
    time.sleep(0.5)
else:
    state = get_state()
    print(f"\n\nDP 116 after {WAIT_SECONDS}s = '{state}'")
    print("⚠️  Clean not triggered via DP 107 fake visit.")
    print("The device may validate the visit data before acting on it.")
