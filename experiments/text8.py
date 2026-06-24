import tinytuya
import time

DEVICE_ID = "bf2d18bee483a61fcidv6"
IP_ADDRESS = "192.168.68.124"
LOCAL_KEY = ";Y`Ku~B^5MaT^bTM"

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

# We are testing if DP 106 responds to different instructions
# AQEAAQA= was Flatten
# Let's try common Tuya variants for "Clean" and "Empty"
test_payloads = ["AQEAAQE=", "AQEAAA==", "AgEAAQA=", "AQEBAQA="]

for payload in test_payloads:
    print(f"Testing DP 106 with payload: {payload}")
    device.set_value("106", payload)
    
    # Watch the machine for 10 seconds to see if it acts differently
    time.sleep(10)
    
    # Check if the state (DP 116) changes to something new
    print(f"Status after payload {payload}: {device.status().get('dps', {}).get('116')}")
    
    input("Press Enter to test next payload...")
