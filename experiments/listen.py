import tinytuya
import time

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

print("Listening for litter box data... Press the physical CLEAN button now!")

# Keep a connection open and print any live broadcasts
device.status() 
while True:
    try:
        data = device.receive()
        if data:
            print("\n[CATCH] Raw Data Received:")
            print(data)
    except KeyboardInterrupt:
        print("\nStopping listener.")
        break
    time.sleep(0.1)
