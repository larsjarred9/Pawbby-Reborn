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

# Flatten (confirmed) = AQEAAQA=
# These are the most likely candidates for "Clean" on DP 106
clean_candidates = [
    ("AQEAAQE=", "Clean candidate 1"),
    ("AQEBAQA=", "Clean candidate 2"),
    ("AQECAQA=", "Clean candidate 3"),
    ("AQEDAQA=", "Clean candidate 4"),
    ("AgEAAQA=", "Clean candidate 5"),
    ("AQEAAA==", "Clean candidate 6"),
    ("AQEAAQI=", "Clean candidate 7"),
]

print("=== Pawbby Clean Command Finder ===")
print(f"Connecting to {IP_ADDRESS}...\n")

status = device.status()
dps = status.get("dps", {})
print(f"Current state  → DP 116: {dps.get('116')}  |  DP 112 (weight): {dps.get('112')}\n")

for payload, label in clean_candidates:
    print(f"[{label}] Sending payload: {payload}")
    device.set_value("106", payload)
    time.sleep(3)

    s = device.status()
    d = s.get("dps", {})
    print(f"  DP 116 (state): {d.get('116')}  |  DP 112 (weight): {d.get('112')}")

    ans = input("  Did the drum spin / clean start? [y = found it / Enter = try next]: ").strip().lower()
    if ans == "y":
        print(f"\n✅ CLEAN command found!")
        print(f"   Payload : {payload}")
        print(f"   Label   : {label}")
        print(f"\nSave this to functions/clean.py when ready.")
        break
else:
    print("\n⚠️  None of the candidates triggered a clean cycle.")
    print("We may need to check a different DP or payload format.")
