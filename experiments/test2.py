import tinytuya

# Replace X with the ID (107, 108, or 109) that caused the depletion status
DP_ID = "X" 
DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# Attempt to reset by sending a 0 (typical for 'Empty' or 'Normal' state)
print(f"Attempting to reset DP {DP_ID} to 0...")
device.set_value(DP_ID, 0)

# If 0 doesn't work, try sending 1
# device.set_value(DP_ID, 1) 

print("Reset command sent. Please check if the 'Depleted' error clears.")
