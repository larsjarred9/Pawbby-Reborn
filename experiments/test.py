import tinytuya
import time

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# We are skipping 106 as confirmed "Flatten"
candidates = ["107", "108", "109"]

for dp in candidates:
    print(f"Firing command at DP {dp}...")
    try:
        response = device.set_value(dp, "AQEAAQA=")
        print(f"Response for {dp}: {response}")
    except Exception as e:
        print(f"Error on {dp}: {e}")
    
    # Wait 5 seconds to observe the litter box motor
    time.sleep(5)

print("Sweep complete.")
