import tinytuya

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# Force the state back to Idle
print("Attempting to reset DP 116 to idle...")
response = device.set_value("116", "work_idle")
print("Response:", response)
