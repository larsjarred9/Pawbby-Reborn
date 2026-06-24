import tinytuya

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# Attempt to acknowledge/reset the fault on all suspect channels
print("Sending fault reset signal to 107, 108, 109...")
for dp in ["107", "108", "109"]:
    device.set_value(dp, "AQEAAA==") # Often the 'Reset' counterpart to AQEAAQA=
    
print("Reset signals sent. Check your app/dashboard now.")
