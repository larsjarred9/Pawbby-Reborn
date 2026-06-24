import tinytuya

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# Correct syntax for sending a command to a Tuya device
print("Sending reboot command...")
device.send(1, {"1": "reboot"}) 
print("Command sent.")
