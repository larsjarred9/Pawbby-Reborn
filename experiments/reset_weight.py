import tinytuya
import time
import os
from dotenv import load_dotenv

load_dotenv()

DEVICE_ID = os.getenv("DEVICE_ID")
IP_ADDRESS = os.getenv("IP_ADDRESS")
LOCAL_KEY  = os.getenv("LOCAL_KEY")

print("Connecting to Pawbby Smart Litter Box...")
print(f"  Device ID : {DEVICE_ID}")
print(f"  IP Address: {IP_ADDRESS}")

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# --- Read current value ---
status = device.status()
dps = status.get("dps", {})
print("\nCurrent DPS:", dps)
print(f"  DP 112 (weight) is currently: {dps.get('112', 'unknown')}")

# --- Reset DP 112 → 0 ---
print("\nSending reset (DP 112 = 0)...")
response = device.set_value("112", 0)
print("Response:", response)

# --- Verify ---
time.sleep(1.5)
new_status = device.status()
new_dps = new_status.get("dps", {})
new_val = new_dps.get("112", "unknown")
print(f"\nDP 112 after reset: {new_val}")
if new_val == 0:
    print("✅ Weight sensor successfully zeroed!")
else:
    print(f"⚠️  Value is now {new_val}.")
