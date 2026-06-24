import tinytuya
import time

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# We suspect 107, 108, or 109 are the control triggers
candidates = ["107", "108", "109"]

for dp in candidates:
    print(f"\n--- Testing DP {dp} ---")
    
    # Fire the command
    device.set_value(dp, "AQEAAQA=")
    
    # Wait briefly for the device to process the new command
    time.sleep(2)
    
    # Fetch status to see if it changed from 'cat_litter_none'
    status = device.status()
    print(f"Status after firing {dp}: {status.get('dps', {})}")
    
    print("Check if the 'Depleted' error went away. Press Enter to test next...")
    input()
