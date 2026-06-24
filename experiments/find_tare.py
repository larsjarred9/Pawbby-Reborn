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

# Known payloads to try for tare/zero/calibrate on DP 106
# AQEAAQA= = Flatten (confirmed)
# These are common Tuya variants for "tare" or "calibrate"
tare_candidates = {
    "AQEAAQE=": "Variant A",
    "AQEAAA==": "Variant B (reset)",
    "AgEAAQA=": "Variant C",
    "AQEBAQA=": "Variant D",
    "AQECAQA=": "Variant E",
    "AQEDAQA=": "Variant F",
}

print("Current status:")
status = device.status()
print(f"  DP 112 (weight): {status.get('dps', {}).get('112')}")
print(f"  DP 116 (state) : {status.get('dps', {}).get('116')}")

print("\nTrying tare/calibrate payloads on DP 106...")
for payload, label in tare_candidates.items():
    print(f"\n[{label}] Sending payload: {payload}")
    device.set_value("106", payload)
    time.sleep(3)
    s = device.status()
    dps = s.get("dps", {})
    print(f"  DP 112: {dps.get('112')}  |  DP 116: {dps.get('116')}")
    ans = input("  Did anything happen? (y to stop / Enter to continue): ")
    if ans.lower() == "y":
        print(f"Winner: {label} = {payload}")
        break

print("\nDone.")
