import tinytuya
import time # This was the missing piece!

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# Force the weight DP 112 to 0 to clear the negative drift
print("Attempting to zero the weight sensor (DP 112)...")
device.set_value("112", 0)

# Check status again to see if it moved from -34 to 0
time.sleep(1)
print(f"New Status: {device.status()['dps']}")
