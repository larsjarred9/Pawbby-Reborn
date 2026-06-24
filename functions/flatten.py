import tinytuya
import os
from dotenv import load_dotenv

load_dotenv()

DEVICE_ID = os.getenv("DEVICE_ID")
IP_ADDRESS = os.getenv("IP_ADDRESS")
LOCAL_KEY  = os.getenv("LOCAL_KEY")

def send_flatten_command():
    # Initialize the device
    device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
    device.set_version(3.4)

    print(f"Sending flatten command (DP 106) to {IP_ADDRESS}...")

    # Send the payload confirmed by our sweep
    response = device.set_value("106", "AQEAAQA=")

    print("Command sent. Response:", response)

if __name__ == "__main__":
    send_flatten_command()
