# PAWBBY SMART LITTER BOX — FULL RESEARCH NOTES
*Last updated: 2026-05-31 (evening)*

> **Note:** The app source code itself cannot be shared due to copyright restrictions. All findings documented here were derived from independent reverse-engineering and protocol analysis.

---

## Device Info

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Protocol    | TinyTuya v3.4 (local LAN control)                |
| Device ID   | `[REDACTED]`                                      |
| IP Address  | `[REDACTED]`                                      |
| Local Key   | `[REDACTED]`                                      |
| Credentials | stored in `.env` (use python-dotenv to load)      |

> **Note:** The Pawbby app stopped working — this project exists to replace it with a local Python control layer.

> ⚠️ **LISTENER DATA NOTE:**
> `listen_button.py` only captures events while the laptop is open and the script is running. Gaps in timestamps = laptop was closed / script was not active. Events during those gaps (cat visits, auto-cleans, etc.) are **NOT** recorded. All findings should be interpreted with this in mind.

---

## Complete DP Map

### Complete DP Schema (from v2.0 Thing Model API)

**Endpoint:** `GET /v2.0/cloud/thing/{device_id}/shadow/properties`
**Retrieved:** 2026-06-01

| DP  | Code              | Name (CN)     | Access | Type   | Notes                                                    |
|-----|-------------------|---------------|--------|--------|----------------------------------------------------------|
| 101 | work_state        | 工作状态       | RW ✏️  | raw    | ❓ NEVER TRIED — current: AQAAAQQ= (01 00 00 01 04)     |
| 102 | fault_code        | 故障码         | RW ✏️  | raw    | clean result/count: AQAACwAAAAAAAAAAAAAA                 |
| 103 | device_state      | 设备状态       | RW ✏️  | raw    | composite status blob (changes with every state)         |
| 104 | cat_info          | 猫咪信息       | RW ✏️  | raw    | cat profile data (empty in practice)                     |
| 105 | device_control    | 设备控制       | RW ✏️  | raw    | ❓ NEVER TRIED — general device control                  |
| 106 | clean_control     | 清理控制       | RW ✏️  | raw    | FLATTEN / EMPTY commands (confirmed working)             |
| 107 | toilet_data       | 如厕数据       | RW ✏️  | raw    | cat visit summary (AQAABRBQABUA seen)                   |
| 108 | device_info       | 设备信息       | RW ✏️  | raw    | AQAAEk1HUzEwNDA0MjUwNDE4MDA0NA==                       |
| 109 | weight_cal        | 称重校准       | RW ✏️  | raw    | ❓ weight calibration/tare — NEVER TRIED                 |
| 110 | calibrat_result   | 校准结果       | RW ✏️  | raw    | calibration result: AQEAAQA=                            |
| 111 | debug_data_01     | 调试数据01     | ro     | value  | raw weight ADC (e.g. 4116)                              |
| 112 | debug_data_02     | 调试数据02     | ro     | value  | filtered weight in grams (e.g. 5636)                    |
| 113 | debug_data_03     | 调试数据03     | ro     | value  | resets to 0 on cat_near_leave                           |
| 114 | data_flag_01      | 数据标志01     | ro     | enum   | motor/sensor status (e.g. motor_ok)                     |
| 115 | data_flag_02      | 数据标志02     | ro     | enum   | settings flags (e.g. deodorant_days)                    |
| 116 | data_flag_03      | 数据标志03     | ro     | enum   | device state machine (READ-ONLY!)                       |
| 117 | motor_data        | 电机相关数据   | ro     | string | motor debug string                                       |

> ⚠️ **IMPORTANT:** DP 116 (`data_flag_03`) is **READ-ONLY** — writing to it always fails
> ⚠️ DP 115 (`data_flag_02`) exists! Was missing from `status()` response before.
> ⚠️ DP 101 is the REAL 工作状态 DP — we were sending commands to DP 106 all along!

---

### Status Returned by `device.status()`

```python
{'111': 4049, '112': 6383, '113': 4049,
 '114': 'motor_ok', '116': 'work_idle',
 '117': 'cu=0 FG=2511 BRK=1 PWM=0 POWER=1'}
```

> DPs 102, 103, 106 are **NOT** returned by `status()` — they are push/event DPs that only appear in live broadcasts.

---

### Broadcast-Only DPs (device pushes, not in `status()`)

#### DP 102 — Clean cycle result reporter
- Broadcasts at **END** of every manual clean cycle (`work_mclean`)
- Value observed: `'AQAACwAAAAAAAAAAAAAA'`
- Decoded bytes: `01 00 00 0B 00 00 00 00 00 00 00 00 00 00 00`
- Byte[3] = `0x0B` = 11 (likely total clean cycle count, increments)
- Status: ❓ NOT yet tested as a TRIGGER — priority for next session
- Hypothesis: read-only result DP (device writes it after clean)

#### DP 103 — Composite binary device status blob (设备状态 / "Device status")
> NOTE: Was previously guessed as DP 115 — CORRECTED, it is DP 103

- Broadcasts every ~10 min at idle AND on every state change
- Format: base64-encoded binary packet (26 bytes)
- State-dependent values observed:

| State       | Value                                          |
|-------------|------------------------------------------------|
| Idle        | `AQAAFQAAAAAWAAAACB4BAAAAAAABAgA7AA==`         |
| cat_near    | `AQAAFQAAAAAWAAEBCB4BAAAAAAABAgA7AA==`         |
| cat_enter   | `AQAAFQAAAAAWAAABCB4BAAAAAAABAgA7AA==`         |
| After clean | `AQAAFQAAAAAWAAAACB4BAAAAAAABAgA8AA==`         |

- Key byte position: index ~7 encodes cat presence:
  - `AAAA` (00 00) = idle / no cat
  - `AAEB` (00 01 01) = cat_near
  - `AAAB` (00 00 01) = cat inside / leaving
- Status: ❓ NOT yet tested as a TRIGGER

#### DP 106 — Main command trigger (工作状态 / "Work status")
- Payload format (base64 of 5 bytes): `[01][mode][00][01][00]`

**Confirmed command modes (sent by us → state observed):**

| Payload      | Bytes              | Result                                 |
|--------------|--------------------|----------------------------------------|
| `AQEAAQA=`   | 01 01 00 01 00     | `work_smooth` = FLATTEN ✅ (confirmed) |
| `AQIAAQA=`   | 01 02 00 01 00     | `work_empty` = EMPTY/DUMP ✅ ⚠️ BE CAREFUL |
| `AQMAAQA=`   | 01 03 00 01 00     | `cat_near` = side effect, not useful  |
| `AQQAAQA=`   | 01 04 00 01 00     | `cat_near_leave` = side effect        |
| modes 05–12  |                    | `work_idle` = no effect               |
| integer 1–6  |                    | `work_idle` = no effect               |

**Deep-test result** (`find_clean_deep.py` — exhaustive):
- Mode=01 + any variation of bytes [2],[3],[4] → always `work_smooth` (flatten)
- Conclusion: **byte[1]=01 ALWAYS means flatten** regardless of other bytes

**Reported BY device itself (echo on status changes):**

| Payload    | Bytes          | Meaning                                         |
|------------|----------------|-------------------------------------------------|
| `AQAAAQA=` | 01 00 00 01 00 | `work_idle` = standby                           |
| `AQIAAQA=` | 01 02 00 01 00 | `work_aclean` = AUTO clean (device self-triggers)|

> NOTE: 工作状态 may be a separate READ-ONLY reporting DP, not the writable DP 106

❌ `work_mclean` NOT triggered via DP 106

#### DP 107 — Cat visit data reporter (如厕数据 / "Toilet data")
- ✅ CONFIRMED as 如厕数据 DP
- Broadcasts ONLY when cat has a real interaction (not just a peek/cat_near)
- Fires just before auto-clean (`work_aclean`) is triggered
- Value observed: `'AQAABRBQABUA'`
- Timing: broadcasts ~at `cat_near_leave`, then `work_aclean` fires ~70s later
- NOT triggered for quick `cat_near`-only visits (cat just sniffs, doesn't enter)
- Previous tests (bool True / int 1 / int 0) all returned `work_idle`
- ❓ NOT yet tested with its native base64 payload as a trigger

#### DP 108–110
- No response to bool/int values (unknown function)

---

### Status DPs (in `device.status()` response)

#### DP 111 — Debug weight sensor 1 (调试数据01 / "Debug data 01")
- Values: integer (e.g. 4049 idle, 4158→4132 during cat visit)
- Changes as cat moves on/off the scale

#### DP 112 — Filtered weight sensor (调试数据02 / "Debug data 02")
- Values: integer (grams)
- Read-only — firmware rejects direct writes
- Idle (box empty): ~6000–7000g (drifts slowly over days)
- Cat inside: ~10000–11000g
- Long-term drift observed over ~20 hours: `6380g → 6103g → 6025g → 5879g` (gradual downward drift, normal)
- Negative drift can occur (e.g. -237), resolves itself

#### DP 113 — Debug sensor 3 (调试数据03 / "Debug data 03")
- Values: integer
- At idle: same value as DP 111 (e.g. 4049)
- Resets to 0 when cat leaves (`cat_near_leave` event)
- May represent: litter disturbance delta or tare offset

#### DP 114 — Motor status
- Values: `"motor_ok"`

#### DP 115 — UNKNOWN
- Previously guessed as 设备状态 — **INCORRECT**
- The composite status blob is actually DP 103 (see above)
- DP 115 does not appear in `status()` or live broadcasts observed so far

#### DP 116 — Device state machine (数据标志03 / "Data flag 03")
- **READ-ONLY** reporting DP
- All known states:

| State           | Description                                             |
|-----------------|---------------------------------------------------------|
| `work_idle`     | idle / standby                                          |
| `cat_near`      | cat approaching, detected near box                      |
| `cat_enter`     | cat is inside using the box                             |
| `cat_leave`     | cat stepping out (weight dropping)                      |
| `cat_near_leave`| cat has fully left the sensor range                     |
| `work_smooth`   | FLATTEN / leveling litter (triggered via DP 106)        |
| `work_aclean`   | AUTOMATIC clean (~1 min after cat visit, device self-triggers) |
| `work_mclean`   | MANUAL clean ❓ trigger not yet found remotely           |
| `work_empty`    | EMPTY / dump litter (triggered via DP 106 ⚠️)           |

#### DP 117 — Motor debug string (电机相关数据 / "Motor related data")
- Format: `"cu=X FG=X BRK=X PWM=X POWER=X"`
- Idle: `"cu=0 FG=0 BRK=1 PWM=0 POWER=1"`
- Running: `"cu=221 FG=1915 BRK=0 PWM=0 POWER=1"`

**Motor sequence observed during `work_mclean` (physical button):**

| Time   | State                                          |
|--------|------------------------------------------------|
| t+0s   | [DP 116 → work_mclean]                         |
| t+38s  | cu=231  FG=1915  BRK=0  (drum starts spinning) |
| t+62s  | cu=0    FG=5095  BRK=1  (brake, phase change)  |
| t+87s  | cu=221  FG=0     BRK=0  (resume, different direction?) |
| t+112s | cu=250  FG=7581  BRK=0  (high speed final phase)|
| t+128s | [DP 102 broadcasts result blob]                |
| t+137s | cu=0    FG=7158  BRK=1  (stop)                 |

---

### Unknown DP (number not confirmed)

**如厕数据 ("Toilet / litter use data")**
- Reported after cat visit ends (before `work_aclean`)
- Example value: `AQAABQ/RACIA`
- Likely encodes: visit duration, waste weight, litter used

---

## Complete DP Sweep Results

| Range       | Status                                                              |
|-------------|---------------------------------------------------------------------|
| DPs 1–66    | ALL work_idle — fully ruled out (`sweep_low_dps.py`)               |
| DPs 67–99   | NOT YET TESTED — resume `sweep_low_dps.py` from DP 67              |
| DPs 100–105 | NOT YET TESTED — run `find_mclean2.py` Section B                   |
| DP 106      | Fully mapped (see above)                                            |
| DPs 107–110 | bool/int values tested — no effect (except DP 107 True = work_smooth)|
| DPs 111–117 | Sensor/status DPs (read-only)                                       |
| DPs 118–135 | flatten payload tested — all work_idle                              |
| DPs 118–150 | mode-03 payload tested — all work_idle                              |
| DPs 136+    | NOT YET TESTED                                                      |

---

## State Sequence — Full Cat Visit + Auto Clean

**Cat quick-visit** (no entry, just cat_near):
```
[cat_near] → [cat_near_leave]  (within ~60s)
```
- DP 103 changes to cat_near variant, then reverts
- NO DP 107 broadcast, NO `work_aclean` triggered

**Cat real visit:**
```
[cat_near] → [cat_enter] → [cat_leave] → [cat_near_leave] → [work_idle]
```
- DP 107 broadcasts `'AQAABRBQABUA'` (visit summary)
- ~70 seconds later → `[work_aclean]` triggered automatically

**Manual clean** (physical button only so far):
```
[work_mclean] ← ONLY DP 116 broadcasts, NO command DP observed
    ↓ full motor sequence runs (~2.5 min)
    ↓ DP 102 broadcasts 'AQAACwAAAAAAAAAAAAAA' (cycle count)
    ↓
[work_idle]
```

---

## Functions (`scripts/functions/`)

| Script       | Command                           | Result               |
|--------------|-----------------------------------|----------------------|
| `flatten.py` | DP 106 = `AQEAAQA=`               | `work_smooth` ✅     |
| `empty.py`   | DP 106 = `AQIAAQA=`               | `work_empty` ✅ ⚠️   |
| `clean.py`   | ❓ TO BE DETERMINED               | target: `work_mclean`|

---

## What We Tried for `work_mclean` (all ruled out)

**DP 106:**
- ✗ All mode bytes 01–12
- ✗ All byte[2],[3],[4] variations with mode=01
- ✗ Integer values 1–6
- ✗ String `'work_mclean'` written directly

**DP 107–110:**
- ✗ bool True, int 1, int 0

**DPs 116, 118–135:**
- ✗ flatten payload (`AQEAAQA=`)
- ✗ mode-03 payload (`AQMAAQA=`)
- ✗ string `'work_mclean'`

**DPs 118–150:**
- ✗ mode-03 payload

**DPs 1–66:**
- ✗ flatten payload, mode-03, bool True, int 1

**DP 116:**
- ✗ Direct write `'work_mclean'`

**Physical button listener:**
- → Only DP 116 changes to `'work_mclean'` — no command DP broadcast seen
- → Trigger DP is write-only (no echo) OR uses firmware/cloud path

**DP 101 (work_state)** — confirmed RW from schema, NEVER TRIED before:
- ✗ All modes 01–03 as base64 payload → work_idle
- ✗ bool True, int 1/3 → work_idle or ?

**DP 105 (device_control)** — confirmed RW from schema, NEVER TRIED before:
- ✗ All modes 01–03 as base64 payload → work_idle or ?
- ✗ bool True, int 1 → work_idle

**DP 106 extended (modes 13–30):**
- ✗ All returned work_idle

**Tuya Cloud API (biz_type 18 device):**
- ✗ `v1.0 /devices/.../commands` → error 2008 "command or value not support"
- ✗ `v2.0 /cloud/thing/.../shadow/properties POST` → error 40000002
- ✗ `v2.0 /cloud/thing/.../shadow/properties PUT` → error 1004 "sign invalid"
- ✗ `v2.0 /cloud/thing/.../shadow/properties desired` → error 1110
- ✗ `v1.2 /iot-03/devices/.../commands` → error 1108 "uri path invalid"
- ✗ `v2.0 /iot-03/devices/.../commands` → error 1108
- Note: getstatus returns `[]` for biz_type 18 devices via v1.0 API; v2.0 shadow GET works for reading, but writes are blocked
- Note: device IS online and visible in Tuya cloud account

**Fake cat visit via DP 107:**
- ✗ Device accepted the write but DID NOT trigger auto-clean
- → Device validates internal weight history before auto-cleaning

---

## ✅ What Works Remotely (confirmed)

```python
FLATTEN:  device.set_value('106', 'AQEAAQA=')  → work_smooth
EMPTY:    device.set_value('106', 'AQIAAQA=')  → work_empty  ⚠️ clears everything
STATUS:   device.status()                       → DP 111–117
MONITOR:  listen_button.py                      → all broadcasts in real-time
```

---

## ❌ Final Conclusion: `work_mclean`

> **`work_mclean` CANNOT be triggered remotely by any known method.**

**Evidence:**
- Physical button press triggers ONLY DP 116 broadcast (no command DP)
- All RW DPs (101–110) tested — none trigger `work_mclean`
- All DP 106 modes 01–30 tested — only 01 and 02 have effects
- All Tuya Cloud API endpoints fail for biz_type 18 devices
- DPs 1–66 and 118–150 swept — nothing responds

**Root cause:**
The physical button triggers a firmware GPIO interrupt that drives the motor directly. No Tuya DP is written as the trigger command. The Pawbby app likely used a **PROPRIETARY backend** (not standard Tuya Cloud) to send this command — which is now broken/discontinued.

**Alternative:**
For daily use, flatten (`work_smooth`) + auto-clean (`work_aclean`, self-triggered by device after cat visits) covers 95% of needs. The deep manual clean (`work_mclean`) requires the physical button.

**Unexplored (low priority):**
- DP 109 (`weight_cal`): may allow taring/calibrating the weight sensor
- DPs 67–99: never finished sweep (stopped at DP 66)
- Proprietary Pawbby backend API (would require traffic analysis)

---

## Script Index

| Script                    | Purpose                                                    |
|---------------------------|------------------------------------------------------------|
| `functions/flatten.py`    | send flatten command ✅                                    |
| `functions/empty.py`      | send empty/dump command ✅ ⚠️                              |
| `listen_button.py`        | listen for all device broadcasts in real-time              |
| `cloud_clean.py`          | Tuya Cloud API attempts (all failed for mclean)            |
| `reset_weight.py`         | check/attempt to zero DP 112                               |
| `find_dp101_105.py`       | DP 101 + 105 trigger test (both ❌)                        |
| `find_dp102.py`           | DP 102 trigger test                                        |
| `find_dp106_extended.py`  | DP 106 modes 13–30 sweep (❌)                              |
| `trigger_clean.py`        | fake cat visit attempt (❌)                                |
| `sweep_low_dps.py`        | DPs 1–66 sweep (❌), 67–99 never finished                  |
| `find_mclean.py`          | round 1 mclean hunt (❌)                                   |
| `find_mclean2.py`         | round 2 mclean hunt (❌)                                   |
| `find_clean_deep.py`      | exhaustive byte variation on DP 106 (❌)                   |
| `find_clean_mode.py`      | modes 04–12 on DP 106 (❌)                                 |
| `find_clean_dp.py`        | original DP sweep strategies 1–4 (❌)                      |
| `probe_version.py`        | test TinyTuya protocol versions                            |

---

## AWS & STOMP Cloud Backend (from APK Analysis)

> ⚠️ **Copyright note:** The app source code itself cannot be shared due to copyright restrictions. The following was derived from independent reverse-engineering of the publicly distributed APK.

**Backend URLs (React Native module 868):**
- `testUrl`      : `https://t-pawbby-api.mmgg.fun`
- `defaultUrl`   : `https://app-outlands.pawbby.com` (Overseas)
- `defaultCNUrl` : `http://api-pawbby-local.mmgg.fun` (China)

**SockJS / STOMP WebSockets Broker (React Native module 702/703):**
- Endpoint: `s + "/pawbby"` where `s` is the message server URL
  - Debug: `http://t-pawbby-msg.mmgg.fun:8003/pawbby`
  - Production: replaces `'app'` with `'msg'` and `'https'` with `'http'` of the API URL
    - e.g. `http://msg-outlands.pawbby.com:8003/pawbby`
- Connection Headers:
  ```json
  {
    "heart-beat": "10000,10000",
    "x-access-token": "userinfo.token"
  }
  ```
- Subscriptions / Publishes:
  - subscribe: `/user/pawbby/<deviceId>/<topic>`
  - publish: `pawbby/<deviceId>/<topic>`

**App Storage Mechanism (React Native module 570/571):**
- Database Name: `pawbby.db` (SQLite database)
- Table: `DBSettings (SKey varchar(100), SValue text)`
- Key for Token: `'userinfo'` contains JSON with token, tuyaUid, tuyaPwd, etc.
- Database Path: `/data/data/pawbbyoverseas.mmgg.fun/databases/pawbby.db`

---

## ADB Data Extraction Strategies

The official production app is built with:
- `android:debuggable="false"`
- `android:allowBackup="false"`

This blocks simple `run-as` or `adb backup` extraction. Use one of these:

### Option 1 — Rooted Emulator (Recommended)
1. Install APK on a rooted emulator (Genymotion or Android Studio root image)
2. Log in to your account
3. Extract data:
   ```bash
   adb root
   adb pull /data/data/pawbbyoverseas.mmgg.fun/databases/pawbby.db ./pawbby.db
   ```

### Option 2 — Custom Recovery (TWRP)
1. Boot physical phone into TWRP
2. Decrypt `/data` using screen lock credentials
3. Extract data:
   ```bash
   adb pull /data/data/pawbbyoverseas.mmgg.fun/databases/pawbby.db ./pawbby.db
   ```

### Option 3 — Repackage to Debuggable
1. Set `android:debuggable="true"` in `AndroidManifest.xml`
2. Rebuild, sign with a debug key, and install
3. **NOTE:** Reinstall requires uninstalling first due to signature change, which will wipe current cache

---

## Litter Box Plugin Bundle Analysis

> Source: `/sdcard/Android/data/pawbbyoverseas.mmgg.fun/files/fetjzvf6o6dihnhq/bundles/fetjzvf6o6dihnhq.bundle`
> Pulled: 2026-06-01 (3,490,251 bytes = ~3.49 MB)

### STOMP Topic / Command Number Mapping (`LitterBoxCommand` enum)

| Number | Code            | Description                  |
|--------|-----------------|------------------------------|
| 101    | workStatus      | device working state         |
| 102    | deviceFault     | error/fault data             |
| 103    | deviceStatus    | general status               |
| 104    | catList         | cat recognition list         |
| 105    | deviceGate      | settings/gate control        |
| 106    | clearControl    | **CLEANING commands** ← KEY  |
| 107    | toliteData      | toilet use log data          |
| 108    | device_info     | device information           |
| 109    | weightCal       | weight calibration           |
| 110    | calibratResult  | calibration result           |
| 118    | deviceLanguage  | screen language              |

### STOMP Publish / Subscribe URL Structure

**PUBLISH (send TO device):**
```
Topic: {appId}/{deviceUuid}/{commandNumber}
e.g. : pawbby/{uuid}/106
```

**SUBSCRIBE (receive FROM device):**
```
Topic: /user/{appId}/{deviceUuid}/{commandNumber}
e.g. : /user/pawbby/{uuid}/106
```

Headers (for both):
```json
{ "heart-beat": "10000,10000", "x-access-token": "<userinfo.token>" }
```

### Payload Format — `createValue(ver, flag, commandWord, data)`

```
Payload = formatNum(ver,2) + formatNum(commandWord,2) + formatNum(flag,4) + data
```
(All numbers converted to hex, zero-padded to specified digit count)

### Cleaning Commands — topic 106 (`clearControl`)

| Command      | Function                  | Payload      | Full STOMP body                    |
|--------------|---------------------------|--------------|------------------------------------|
| startClear   | MANUAL CLEAN START        | `"01000000"` | `{"clearControl": "01000000"}`     |
| startFP      | FIXED POINT / SPOT CLEAN  | `"01010000"` | `{"clearControl": "01010000"}`     |
| cancelClear  | CANCEL/STOP CLEAN         | `"01030000"` | `{"clearControl": "01030000"}`     |

### Other Commands (topic 105 = `deviceGate`)

```js
syncTimeZone(uuid, cb):
  Payload: createValue(1, 1, SyncTimeZone, formatNum(utcOffset.toString(16), 2))

setWeightUnit(uuid, unit, cb):
  Payload: createValue(1, 1, SetWeightUnit, formatNum(unit, 2))
```

### Weight Calibration (topic 109 = `weightCal`)

```js
takeOutLitterBox(uuid, cb):  createValue(1, 0, 0, '')
resetWeight(uuid, cb):       createValue(1, 0, 1, '')
```

### Cat List (topic 104 = `catList`)

```js
getCatList(uuid, cb):   createValue(1, 0, GetList, '')
setCat(uuid, data, cb): createValue(1, '0F', Set, data)
```

---

## How to Trigger a Manual Clean (Summary)

1. **Connect to STOMP broker:**
   ```
   ws://msg-outlands.pawbby.com:8003/pawbby/websocket
   (or use SockJS: http://msg-outlands.pawbby.com:8003/pawbby)
   ```

2. **STOMP CONNECT frame with headers:**
   ```
   heart-beat: 10000,10000
   x-access-token: <your token from DBSettings.userinfo.token>
   ```

3. **SEND frame to trigger clean:**
   ```
   Destination: pawbby/<deviceUuid>/106
   Headers:     { heart-beat: '10000,10000', x-access-token: '<token>' }
   Body:        {"clearControl":"01000000"}
   ```

4. **Subscribe to receive result/status:**
   ```
   Destination: /user/pawbby/<deviceUuid>/106
   ```

> NOTE: `deviceUuid` = the Tuya/Pawbby device uuid (not MAC address). This can be found in the app under device settings or via the Tuya API/cloud after logging in.

---

## Server Status (checked 2026-06-01)

| Server                                 | Status                  | Notes                                                     |
|----------------------------------------|-------------------------|-----------------------------------------------------------|
| `http://api-pawbby-local.mmgg.fun`     | ✅ ONLINE (HTTP only)   | IP: Alibaba Cloud, China. Port 8003 timed out. Root path serves a different Chinese app. |
| `https://app-outlands.pawbby.com`      | ❌ BAD GATEWAY (502)    | Overseas production server is dead/down                   |
| `https://t-pawbby-api.mmgg.fun`        | ❌ DOES NOT RESOLVE     | Internal test server — offline or private network only    |
| `https://t-api-outlands.pawbby.com`    | ⚠️ UNKNOWN              | Hard-coded as debug/test server in main bundle             |

- `http://api-pawbby-local.mmgg.fun`:
  - Port 80: Responds 200 OK
  - Port 8003: TIMED OUT (STOMP broker not exposed)
  - API paths (e.g. `/user/login`, `/device/types`): Return "Not Found"
  - STOMP URL derivation: `apiUrl.replace('app','msg').replace('https','http') + ':8003/pawbby'`
    → `http://msg-pawbby-local.mmgg.fun:8003/pawbby` (DNS does NOT resolve)

> NOTE: All REST API backends return 502. The app functions offline using cached data in `pawbby.db`. STOMP broker port 8003 is consistently blocked/firewalled across all servers — may require VPN or be down globally.

---

## Complete REST API Route List (from main bundle)

> ⚠️ **Copyright note:** The app source code itself cannot be shared due to copyright restrictions. Route list derived from independent reverse-engineering.

```
Base URL = apiUrl from DBSettings (set by /login/region response)
Default overseas : https://app-outlands.pawbby.com
Default China    : http://api-pawbby-local.mmgg.fun
```

### AUTH
```
POST /login/email             — Email + password login
POST /login/mobile            — Mobile number login
POST /login/region            — Get regional apiUrl (no auth needed)
POST /login/bind-email        — Bind email to account
POST /apple/auth              — Apple sign-in
POST /facebook/auth           — Facebook sign-in
POST /google/auth             — Google sign-in
```

### USER
```
GET  /user/info               — Get user profile
POST /user/modify             — Edit user profile
POST /user/login              — (alternate login path)
POST /user/logout             — Logout
POST /user/delete             — Delete account
POST /user/bind               — Bind account
GET  /user/check-bind         — Check bind status
```

### EMAIL / PASSWORD
```
POST /email/register          — Register new account
POST /email/send              — Send verification email
POST /email/verfication       — Verify email code
POST /email/modify            — Change email
POST /email/bind-email-apple  — Bind Apple email
POST /password/forget         — Forgot password
POST /password/modify         — Change password
POST /password/verfication    — Password reset verification
```

### DEVICE
```
GET  /device/v4/list          — List paired devices
POST /device/v3/bind          — Pair a device
POST /device/v3/set           — Update device settings
POST /device/v3/v             — (unknown, likely verify)
GET  /device/v3/plugin-info   — Get plugin/firmware info
POST /device/delete           — Remove a device
GET  /device/info             — Device info
GET  /device/logs             — Device log history
POST /device/modify           — Edit device (e.g. rename)
POST /device/modify-unit      — Change weight unit
GET  /device/product          — Product details
GET  /device/types            — Supported device types
POST /device/v4/revoke        — Revoke device access
```

### PET
```
GET  /pet/v2/list             — List pets
POST /pet/v2/add              — Add pet
POST /pet/v2/edit             — Edit pet info
GET  /pet/v2/info             — Pet detail
POST /pet/v2/batch-bind       — Bind pets to device
POST /pet/delete              — Delete pet
GET  /pet/breed/list          — Breed list
GET  /pet/food/list           — Pet food list
GET  /pet/food/hot            — Popular foods
GET  /pet/food/category/list  — Food categories
POST /pet/food/add            — Add custom food
POST /pet/food/edit           — Edit custom food
POST /pet/food/delete         — Delete custom food
GET  /pet/food/info           — Food details
POST /pet/food/custom         — Create custom food
```

### MESSAGES
```
GET  /message/list            — Notification list
GET  /message/unread          — Unread count
POST /message/report          — Mark message read
```

### FEEDBACK
```
GET  /feedback/list           — Feedback history
POST /feedback/create         — Submit feedback
GET  /feedback/detail         — Feedback detail
POST /feedback/batch-deleted  — Delete feedback records
GET  /feedback/unread-replay-count — Unread reply count
```

### FAQ
```
GET  /faq/v2/list             — FAQ list
GET  /faq/v2/detail           — FAQ detail
```

### MISC
```
POST /file/uploadpng          — Upload image (for feedback, pet photo)
```

---

## How to Get Your Auth Token + Device UUID

The `x-access-token` lives in `pawbby.db` (internal storage, no root access). Two practical options to extract it:

### Option 1 — mitmproxy (RECOMMENDED, ~10 min)

Sits as a "man in the middle" between your phone and the internet. When the Pawbby app opens, it sends a STOMP WebSocket CONNECT frame that includes your `x-access-token` in plaintext HTTP headers. mitmproxy captures it without touching the app or phone storage.

**Why no SSL problem:** The China STOMP broker uses plain HTTP, so there is zero certificate pinning to fight for the STOMP connection.

**Steps:**
1. Install mitmproxy on Mac:
   ```bash
   brew install mitmproxy
   ```
2. Find your Mac's local IP:
   ```bash
   ipconfig getifaddr en0
   # example result: 192.168.1.50
   ```
3. Start the mitmproxy web UI on your Mac:
   ```bash
   mitmweb --listen-port 8080
   # opens browser at http://localhost:8081
   ```
4. On your phone: **Settings → Wi-Fi → tap your network → Configure Proxy**
   - Set to: Manual
   - Server: `<your Mac IP>` Port: `8080`
5. On the phone browser, visit `http://mitm.it` and install the mitmproxy CA certificate for Android (Settings → Security → Install certificate)
6. Open the Pawbby app — it connects to STOMP on startup
7. In the mitmweb browser UI (`http://localhost:8081`):
   - Look for a WebSocket connection to `msg-outlands.pawbby.com:8003` OR `msg-pawbby-local.mmgg.fun:8003`
   - Click it → inspect the request headers
   - You will see: `x-access-token: <YOUR_TOKEN_HERE>`
8. Also grab the STOMP SEND destination topic URL, which contains the `deviceUuid` (the long alphanumeric string after `/pawbby/`)

---

### Option 2 — Rooted Android Emulator (~30–45 min)

Creates a fresh emulator with full root, installs the APK, lets you log in, then directly reads `pawbby.db`.

> **CRITICAL:** Must use a "Google APIs" system image (NOT "Google Play"). Only Google APIs images allow `adb root`.

**Steps:**
1. Android Studio → Device Manager → Create Virtual Device (e.g. Pixel 6)
2. System Image: select a "Google APIs" image (NOT Google Play), e.g. API 33, x86_64
3. Start the emulator, then:
   ```bash
   adb root
   adb install /path/to/PAWBBY_3.0.5.apk
   ```
4. Open the emulated Pawbby app, log in with your account
5. Pull the database:
   ```bash
   adb root
   adb pull /data/data/pawbbyoverseas.mmgg.fun/databases/pawbby.db ./pawbby.db
   ```
6. Read the token:
   ```bash
   sqlite3 pawbby.db "SELECT SValue FROM DBSettings WHERE SKey='userinfo';"
   # Output is JSON — look for the 'token' field:
   # {"token":"eyJ...", "tuyaUid":"ay...", ...}
   ```
7. The `deviceUuid` is found by querying:
   ```bash
   sqlite3 pawbby.db "SELECT SValue FROM DBSettings WHERE SKey='deviceList';"
   ```
   Or check device info in the app settings screen.

---

### Once You Have Token + UUID: Test the Clean Command

Install wscat and connect to the STOMP broker:

```bash
npm install -g wscat
wscat -c "ws://msg-outlands.pawbby.com:8003/pawbby/websocket"
```

Send raw STOMP frames:

```
CONNECT frame:
  CONNECT\nx-access-token:<token>\nheart-beat:10000,10000\n\n\0

SEND frame (trigger manual clean):
  SEND\ndestination:pawbby/<deviceUuid>/106\nx-access-token:<token>\n\n{"clearControl":"01000000"}\0
```

Expected: device starts cleaning cycle.

---

## Captured Credentials

> ⚠️ **All sensitive values have been redacted for public sharing.**

| Field                   | Value         |
|-------------------------|---------------|
| x-access-token (JWT)    | `[REDACTED]`  |
| JWT uid                 | `[REDACTED]`  |
| JWT id                  | `[REDACTED]`  |
| JWT hashed password     | `[REDACTED]`  |
| Push/notification alias | `[REDACTED]`  |
| Push channel ID (cid)   | `[REDACTED]`  |
| Device UUID             | `[REDACTED]`  |

**Full STOMP topic to trigger manual clean:**
```
Destination : pawbby/<deviceUuid>/106
Body        : {"clearControl":"01000000"}
Auth header : x-access-token: <token>
```

**STOMP connection test result (2026-06-01):**

| Endpoint                              | Status                               |
|---------------------------------------|--------------------------------------|
| `ws://msg-prod-de.pawbby.com:8003`    | TIMED OUT (port 8003 firewalled)     |
| `ws://msg-outlands.pawbby.com:8003`   | DNS not found                        |
| `ws://msg-pawbby-local.mmgg.fun:8003` | DNS not found                        |

→ All STOMP brokers unreachable from outside. Infrastructure appears DOWN.

Test script saved: `send_clean.py` (ready to run when broker comes back online)

---

## Updated Server Status (2026-06-01)

**NEWLY DISCOVERED (from logcat AppManager):**
- `https://app-prod-de.pawbby.com` ❌ 502 Bad Gateway
  - IP: AWS Frankfurt / eu-central-1
  - STOMP broker: `msg-prod-de.pawbby.com:8003` → DNS resolves but port TIMED OUT
  - This is the actual EU production server the app uses

**Full Server Map:**

| REST API Host                           | Status      | STOMP Broker              |
|-----------------------------------------|-------------|---------------------------|
| `https://app-prod-de.pawbby.com`        | ❌ 502      | msg-prod-de:8003 ⏱️        |
| `https://app-outlands.pawbby.com`       | ❌ 502      | msg-outlands:8003 ❌       |
| `https://t-api-outlands.pawbby.com`     | ⚠️ Unknown  | msg-t-api-...:8003 ?      |
| `http://api-pawbby-local.mmgg.fun`      | ✅ HTTP 200 | msg-pawbby-local ❌        |
| `https://t-pawbby-api.mmgg.fun`         | ❌ No DNS   | —                         |

**Next steps to test clean command:**
1. Get device UUID (from app logcat or app settings screen)
2. Wait for or find an active STOMP broker (port 8003 open), OR try direct BLE control via the Tuya local protocol
3. Once broker is reachable:
   ```bash
   wscat -c ws://msg-prod-de.pawbby.com:8003/pawbby/websocket
   # → CONNECT with x-access-token header
   # → SEND {"clearControl":"01000000"} to pawbby/<uuid>/106
   ```

---

## Local Tuya Control — Live DPs (2026-06-01)

Connected directly via LAN — NO cloud needed!

| Field    | Value       |
|----------|-------------|
| Protocol | Tuya v3.4   |
| IP       | `[REDACTED]`|
| Dev ID   | `[REDACTED]`|
| LocalKey | `[REDACTED]`|

> **IMPORTANT:** Local DPS are 111–117, NOT the STOMP topic numbers (101–118). They are different numbering systems!

**LIVE DPS snapshot (device was IDLE at time of capture):**

| DP  | Value                             | Interpretation             |
|-----|-----------------------------------|----------------------------|
| 111 | 4061                              | unknown (counter/weight?)  |
| 112 | 5614                              | unknown (counter/weight?)  |
| 113 | 4070                              | unknown (counter/weight?)  |
| 114 | `'motor_ok'`                      | motor status → OK          |
| 115 | `'nodisturb_mode_disable'`        | do-not-disturb = OFF       |
| 116 | `'work_idle'`                     | current work state → IDLE  |
| 117 | `'cu=0 FG=3630 BRK=1 PWM=0 POWER=1'` | motor internals (raw)  |

**KEY INSIGHT — DP 116 is the work state controller:**
- Current value: `'work_idle'`
- Clean command: likely `'work_mclean'` or `'work_startclean'` or similar → Need to enumerate valid enum values for DP 116

**Known DP 116 values (from bundle string search):**
- `'work_idle'` — standby
- `'work_mclean'` — manual clean (to find/confirm)
- `'work_dumping'` — dumping waste
- `'work_resetting'` — resetting drum
- `'work_mstop'` — manual stop

**Script to query & control: `local_control.py`**
```bash
python3 local_control.py status   # → live DPS
python3 local_control.py clean    # → trigger clean (STOMP format — may need updating)
```

**Command attempt log:**
- Tried DP 116 = `'work_mclean'` → Result: None, DP stayed `'work_idle'` → REJECTED

---

## Session Log — 2026-06-01 Local Control Attempts

**Tools installed:**
```bash
pip3 install tinytuya    # → tinytuya 1.18.1
pip3 install websockets  # → websockets 15.0.1
```

**Files created:**
- `/pawbby/send_clean.py` — STOMP WebSocket clean trigger (cloud, currently dead)
- `/pawbby/local_control.py` — Tuya local protocol controller (LAN, no cloud)

### Tuya Local Protocol

**Connection test:**
- v3.3 → ❌ Error 901 (Network Error)
- v3.4 → ✅ CONNECTED

**Live DPS (confirmed twice, device at idle):**

| DP  | Value                                       |
|-----|---------------------------------------------|
| 111 | 4061 (varies slightly — probably counter)   |
| 112 | 5614/5623 (varies — probably counter)       |
| 113 | 4070 (stable)                               |
| 114 | `'motor_ok'` (motor health status)          |
| 115 | `'nodisturb_mode_disable'` (do-not-disturb off) |
| 116 | `'work_idle'` (work state — clean control DP) |
| 117 | `'cu=0 FG=3630 BRK=1 PWM=0 POWER=1'` (raw motor internals) |

**Command attempt on DP 116:**
- Sent: `'work_mclean'`
- Result: None (device returned nothing / rejected)
- State: DP 116 stayed at `'work_idle'` → command NOT accepted

Conclusion: `'work_mclean'` is **NOT** the correct enum string. Correct string still unknown — need to find valid DP 116 enum values.

---

### Tuya Cloud API

Credentials from `.env`: `[REDACTED — see .env file]`

**Results:**
- `getconnectstatus(device_id)` → `true` (device IS registered + online in Tuya cloud)
- `getfunctions(device_id)` → `functions: []` (schema not accessible with this key)
- `getstatus(device_id)` → `result: []` (status not accessible with this key)

The API key appears to have limited scope — can't read DP schema or status via cloud. Device control may work via `sendcommand()` — not yet tested.

---

### Next Steps

**Option A — Find correct DP 116 enum string:**
1. Try tinytuya wizard:
   ```bash
   python3 -m tinytuya wizard
   ```
   (scans local network, pulls schema from cloud with proper OAuth)
2. Try Tuya Developer Portal → Cloud Project → Devices → Schema
3. Try sending all plausible values:
   `'start_clean'`, `'auto_clean'`, `'cleaning'`, `'manual'`, `'mclean'`, etc.
4. Watch DP 116 value WHILE pressing "Clean" in the real app (via adb logcat) to capture the exact string the app sends → guaranteed correct value

**Option B — Use Tuya cloud `sendcommand()` with the registered app key:**
```python
c.sendcommand(DEVICE_ID, [{'code': 'work_mode', 'value': 'mclean'}])
# (code names differ from DP numbers — need correct 'code' string)
```

**Option C — Capture the exact local packet the app sends via Wireshark/tcpdump:**
```bash
tcpdump -i en0 host <device-ip> -w /tmp/pawbby.pcap
```
Then decode the Tuya v3.4 AES-128 payload using the localKey.

> **RECOMMENDED NEXT:** Option A step 4 — open app, press Clean button, watch logcat for the DP value the real app sends to the device.
