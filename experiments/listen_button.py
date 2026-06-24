import tinytuya
import time
import os
from dotenv import load_dotenv

load_dotenv()

DEVICE_ID = os.getenv("DEVICE_ID")
IP_ADDRESS = os.getenv("IP_ADDRESS")
LOCAL_KEY  = os.getenv("LOCAL_KEY")

device = tinytuya.OutletDevice(DEVICE_ID, IP_ADDRESS, LOCAL_KEY)
device.set_version(3.4)

print("=== Physical Button Listener ===")
print("Press the CLEAN button on the Pawbby now.")
print("This will capture EVERYTHING the device broadcasts.")
print("Press Ctrl+C to stop.\n")

# Initial full status snapshot
status = device.status()
print(f"Current DPS: {status.get('dps', {})}\n")
print("Listening...\n")

device.set_socketTimeout(1)

while True:
    try:
        data = device.receive()
        if data:
            ts = time.strftime("%H:%M:%S")
            print(f"[{ts}] RAW: {data}")
            dps = data.get("dps", {})
            if dps:
                for dp, val in dps.items():
                    print(f"         DP {dp:>3} = {val!r}")
            print()
    except KeyboardInterrupt:
        print("\nStopped.")
        break
    except Exception:
        pass
