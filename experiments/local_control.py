#!/usr/bin/env python3
"""
Pawbby Litter Box — Local Control via Tuya Protocol
====================================================
Reads credentials from .env and controls the device directly
over the local network — no cloud/server needed.

Commands:
  python3 local_control.py status     — get current device state
  python3 local_control.py clean      — trigger manual clean
  python3 local_control.py stop       — cancel clean
  python3 local_control.py fp         — fixed point clean
"""

import sys
import os
import json
import tinytuya

# Load from .env
def load_env(path=".env"):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

env = load_env(os.path.join(os.path.dirname(__file__), ".env"))

DEVICE_ID = env["DEVICE_ID"]   # bf2d18ebee483a61fcidv6
IP        = env["IP_ADDRESS"]  # 192.168.68.124
LOCAL_KEY = env["LOCAL_KEY"]   # *)hGkFt2B+[U*L]5

# Tuya DP IDs mapped from LitterBoxCommand enum in the plugin bundle
DP_WORK_STATUS    = 101
DP_DEVICE_FAULT   = 102
DP_DEVICE_STATUS  = 103
DP_CAT_LIST       = 104
DP_DEVICE_GATE    = 105
DP_CLEAR_CONTROL  = 106   # ← clean commands go here
DP_TOILET_DATA    = 107
DP_DEVICE_INFO    = 108
DP_WEIGHT_CAL     = 109
DP_CALIBRAT       = 110
DP_LANGUAGE       = 118

# Payload format: createValue(ver, commandWord, flag, data)
#   ver=01, commandWord=hex, flag=0000, data=''
CMD_START_CLEAN   = "01000000"   # startClear
CMD_START_FP      = "01010000"   # startFP (fixed point)
CMD_CANCEL        = "01030000"   # cancelClear

def connect(version="3.3"):
    d = tinytuya.Device(DEVICE_ID, IP, LOCAL_KEY, version=version)
    d.set_socketTimeout(8)
    return d

def get_status():
    print(f"Connecting to {IP} (device: {DEVICE_ID})...")
    for ver in ["3.3", "3.4", "3.1"]:
        try:
            d = connect(ver)
            data = d.status()
            if data and "dps" in data:
                print(f"✅ Connected! Protocol: {ver}")
                print(f"\nDevice DPS:")
                for dp, val in data["dps"].items():
                    label = {
                        "101": "workStatus", "102": "deviceFault",
                        "103": "deviceStatus", "104": "catList",
                        "105": "deviceGate", "106": "clearControl",
                        "107": "toiletData", "108": "deviceInfo",
                        "109": "weightCal", "110": "calibratResult",
                        "118": "deviceLanguage"
                    }.get(str(dp), f"dp{dp}")
                    print(f"  DP {dp:>3} ({label}): {val!r}")
                return data, ver
            elif "Error" in str(data):
                print(f"  v{ver}: Error — {data}")
        except Exception as e:
            print(f"  v{ver}: {type(e).__name__}: {e}")
    return None, None

def send_command(cmd_value, cmd_name):
    print(f"\nConnecting to {IP}...")
    data, ver = get_status()
    if not ver:
        print("\n❌ Could not connect to device.")
        print("   Make sure phone and Mac are on the same WiFi network.")
        return

    print(f"\n→ Sending {cmd_name}: DP {DP_CLEAR_CONTROL} = {cmd_value!r}")
    d = connect(ver)
    result = d.set_value(DP_CLEAR_CONTROL, cmd_value)
    print(f"← Result: {result}")

    if result and not result.get("Error"):
        print(f"\n✅ Command sent successfully!")
    else:
        print(f"\n⚠️  Unexpected result: {result}")

# ─── Main ────────────────────────────────────────────────────────────────────

cmd = sys.argv[1].lower() if len(sys.argv) > 1 else "status"

if cmd == "status":
    get_status()

elif cmd == "clean":
    print("🧹 Triggering MANUAL CLEAN...")
    send_command(CMD_START_CLEAN, "startClear")

elif cmd == "stop":
    print("⏹  Cancelling clean...")
    send_command(CMD_CANCEL, "cancelClear")

elif cmd == "fp":
    print("📍 Triggering FIXED POINT clean...")
    send_command(CMD_START_FP, "startFP")

else:
    print(f"Unknown command: {cmd}")
    print("Usage: python3 local_control.py [status|clean|stop|fp]")
