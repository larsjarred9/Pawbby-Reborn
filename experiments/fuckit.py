import tinytuya
import time

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# IDs to skip: 
# 106-109 (Already mapped/functional)
# 111-117 (Sensor/Status data points)
skip_list = ["106", "107", "108", "109", "111", "112", "113", "114", "115", "116", "117"]

print("Initiating Sweep (Excluding 106-109 and 111-117)...")

for dp_id in range(100, 131):
    dp_str = str(dp_id)
    if dp_str in skip_list:
        continue
        
    print(f"Firing at DP {dp_str}...")
    try:
        # Firing the standard trigger payload
        device.set_value(dp_str, "AQEAAQA=")
        time.sleep(0.2)  # Increased delay for safety
    except Exception as e:
        print(f"Error on {dp_str}: {e}")

print("\nSweep complete!")
