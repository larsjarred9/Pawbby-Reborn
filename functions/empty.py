import tinytuya
import os
from dotenv import load_dotenv

load_dotenv()

DEVICE_ID = os.getenv("DEVICE_ID")
IP_ADDRESS = os.getenv("IP_ADDRESS")
LOCAL_KEY  = os.getenv("LOCAL_KEY")

def send_empty_command():
    device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
    device.set_version(3.4)

    print(f"Sending empty/dump command (DP 106) to {IP_ADDRESS}...")
    response = device.set_value("106", "AQIAAQA=")
    print("Command sent. Response:", response)

if __name__ == "__main__":
    send_empty_command()
