#!/usr/bin/env python3
"""
Pawbby Litter Box — Manual Clean Trigger
=========================================
Token and UUID captured via ADB logcat on 2026-06-01.

STOMP over WebSocket (SockJS) to msg-prod-de.pawbby.com:8003/pawbby
Command: {"clearControl":"01000000"} → topic pawbby/<uuid>/106
"""

import asyncio
import json
import websockets

TOKEN = "eyJhbGciOiJIUzI1NiIsIlR5cGUiOiJKd3QiLCJ0eXAiOiJKV1QifQ.eyJ1aWQiOiI0MzA0MTEzMyIsInBhc3N3b3JkIjoiZUhBenY2V3FxbURXcUpwWWlXcys1QT09Iiwib3BlbmlkIjoiIiwic2V4IjowLCJpZCI6MTk2OTA0NzgwMjE1Mzk3MTcxNCwibG9naW4iOnRydWV9.KM5xXQNLwszhZPHw1I3S9pQPEKJ6eRjcH8sdUTzPk_I"
UUID  = "bf2d18ebee483a61fcidv6"

# STOMP broker candidates (SockJS raw WebSocket endpoint)
BROKERS = [
    f"ws://msg-prod-de.pawbby.com:8003/pawbby/websocket",
    f"ws://msg-outlands.pawbby.com:8003/pawbby/websocket",
    f"ws://msg-pawbby-local.mmgg.fun:8003/pawbby/websocket",
]

PUBLISH_DEST  = f"pawbby/{UUID}/106"
SUBSCRIBE_DEST = f"/user/pawbby/{UUID}/106"

STOMP_CONNECT = (
    "CONNECT\n"
    f"x-access-token:{TOKEN}\n"
    "heart-beat:10000,10000\n"
    "accept-version:1.1,1.2\n"
    "\n\x00"
)

STOMP_SUBSCRIBE = (
    "SUBSCRIBE\n"
    f"destination:{SUBSCRIBE_DEST}\n"
    "id:sub-0\n"
    f"x-access-token:{TOKEN}\n"
    "\n\x00"
)

STOMP_SEND = (
    "SEND\n"
    f"destination:{PUBLISH_DEST}\n"
    f"x-access-token:{TOKEN}\n"
    "\n"
    '{"clearControl":"01000000"}'
    "\x00"
)

async def try_broker(url):
    print(f"\n→ Connecting to {url}")
    try:
        async with websockets.connect(
            url,
            additional_headers={"x-access-token": TOKEN},
            open_timeout=8,
            ping_interval=None,
        ) as ws:
            print("  ✅ WebSocket connected!")

            # Send STOMP CONNECT
            await ws.send(STOMP_CONNECT)
            print("  → Sent STOMP CONNECT")

            # Wait for CONNECTED frame
            resp = await asyncio.wait_for(ws.recv(), timeout=6)
            print(f"  ← Server: {repr(resp[:100])}")

            if "CONNECTED" not in resp and "ERROR" not in resp:
                print("  ⚠️  Unexpected response, trying anyway...")

            # Subscribe to response topic
            await ws.send(STOMP_SUBSCRIBE)
            print(f"  → Subscribed to {SUBSCRIBE_DEST}")

            # Send the clean command
            await ws.send(STOMP_SEND)
            print(f"  → Sent startClear command to {PUBLISH_DEST}")
            print(f'     Body: {{"clearControl":"01000000"}}')

            # Wait for response
            print("  ⏳ Waiting for device response (10s)...")
            try:
                for _ in range(5):
                    msg = await asyncio.wait_for(ws.recv(), timeout=10)
                    print(f"  ← Device response: {repr(msg[:200])}")
            except asyncio.TimeoutError:
                print("  ⏱️  No response in 10s (device may be offline or server down)")

            return True

    except (ConnectionRefusedError, OSError) as e:
        print(f"  ❌ Connection failed: {e}")
    except asyncio.TimeoutError:
        print(f"  ⏱️  Timed out connecting")
    except Exception as e:
        print(f"  ❌ Error: {type(e).__name__}: {e}")
    return False

async def main():
    print("=" * 60)
    print("Pawbby Manual Clean Command Sender")
    print("=" * 60)
    print(f"UUID  : {UUID}")
    print(f"Topic : {PUBLISH_DEST}")
    print(f"Body  : {{\"clearControl\":\"01000000\"}}")
    print()

    for broker in BROKERS:
        success = await try_broker(broker)
        if success:
            break
    else:
        print("\n❌ All brokers unreachable. STOMP infrastructure appears down.")
        print("   Next step: Try BLE local control via Tuya local protocol.")

if __name__ == "__main__":
    asyncio.run(main())
