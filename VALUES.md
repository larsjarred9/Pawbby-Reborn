# PAWBBY SMART LITTER BOX — FULL RESEARCH NOTES
*Last updated: 2026-10-07 — settings protocol (DP 105 / DP 103 / DP 113–115) fully decoded and hardware-confirmed; see [`DP105_SETTINGS.md`](DP105_SETTINGS.md) for the detailed write-up.*

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
| 102 | fault_code        | 故障码         | RW ✏️  | raw    | clean result code: AQAACwAAAAAAAAAAAAAA (0x0B status code, not counter) |
| 103 | device_state      | 设备状态       | RW ✏️  | raw    | ✅ FULLY DECODED — settings + live-status snapshot (see DP 103 section / `DP105_SETTINGS.md`) |
| 104 | cat_info          | 猫咪信息       | RW ✏️  | raw    | cat profile data (empty in practice)                     |
| 105 | device_control    | 设备控制       | RW ✏️  | raw    | ✅ CONFIRMED — SETTINGS (`deviceGate`): auto-clean, delay, quiet period, soft clumps, screen, litter type, deodorant reset, time zone, unit |
| 106 | clean_control     | 清理控制       | RW ✏️  | raw    | CLEAN / FLATTEN / EMPTY commands (all confirmed working ✅) |
| 107 | toilet_data       | 如厕数据       | RW ✏️  | raw    | cat visit summary (01 00 00 05 [weight WW WW in g] 00 [xx] 00) |
| 108 | device_info       | 设备信息       | RW ✏️  | raw    | AQAAEk1HUzEwNDA0MjUwNDE4MDA0NA==                       |
| 109 | weight_cal        | 称重校准       | RW ✏️  | raw    | TARE / zero scale: AQEAAA== (01 01 00 00) ✅ CONFIRMED  |
| 110 | calibrat_result   | 校准结果       | RW ✏️  | raw    | calibration result: AQEAAQA=                            |
| 111 | debug_data_01     | 调试数据01     | ro     | value  | raw weight ADC (e.g. 4116)                              |
| 112 | debug_data_02     | 调试数据02     | ro     | value  | filtered weight in grams (e.g. 5636)                    |
| 113 | debug_data_03     | 调试数据03     | ro     | value  | live cat weight during a visit; also numeric payload of DP 115 ACKs (tz offset, deodorant days) |
| 114 | data_flag_01      | 数据标志01     | ro     | enum   | event flag: `motor_ok`, `deodorant_reset` (NOT only motor health!) |
| 115 | data_flag_02      | 数据标志02     | ro     | enum   | settings ACK enum: `nodisturb_time`, `nodisturb_mode_enable/disable`, `stool_mode_*`, `auto_screen_*`, `child_lock_*`, `time_zone`, `deodorant_days` |
| 116 | data_flag_03      | 数据标志03     | ro     | enum   | device state machine (READ-ONLY!)                       |
| 117 | motor_data        | 电机相关数据   | ro     | string | motor debug string                                       |

> ⚠️ **IMPORTANT:** DP 116 (`data_flag_03`) is **READ-ONLY** — writing to it always fails
> ⚠️ DP 115 (`data_flag_02`) exists! Was missing from `status()` response before.
> ⚠️ DP 101 is the REAL 工作状态 DP — we were sending commands to DP 106 all along!
> ✅ **2026-10-07:** DP 105 is the settings DP. Every option of the original app (auto-clean delay, quiet period, …) is now writable locally — see `DP105_SETTINGS.md`.

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
- Broadcasts at **END** of clean cycles (`work_mclean` and `work_aclean`)
- Value observed: `'AQAACwAAAAAAAAAAAAAA'`
- Decoded bytes: `01 00 00 0B 00 00 00 00 00 00 00 00 00 00 00`
- Byte[3] = `0x0B` = 11: **Clean result status code**, NOT a counter. Tested across consecutive manual and auto clean cycles by @managementboy; the value remains static `0x0B`.
- Status: Read-only result DP (device writes it after clean)

#### DP 103 — Settings + status snapshot (设备状态 / "Device status") ✅ FULLY DECODED
> NOTE: Was previously guessed as DP 115 — CORRECTED, it is DP 103
> Decoded 2026-10-07 from the vendor app's `analysisStatus` / `RefreshInfo` parsers; validated on hardware.

- Broadcasts every ~10 min at idle, on every state change, and **after every DP 105 settings write** (this is how settings are read back). Not returned by `DP_QUERY`; to force a snapshot try Tuya `DP_REFRESH` (cmd `0x12`, `{"dpId":[103]}`) first and, if the firmware ignores it, re-push the time zone on DP 105 (harmless write, confirmed to trigger a snapshot within ~1 s).
- Format: `01 00 00 15` header (len = 0x15 = 21 data bytes) + 21 data bytes, base64 on the wire
- Sample values:

| State       | Value                                          |
|-------------|------------------------------------------------|
| Idle        | `AQAAFQAAAAAWAAAACB4BAAAAAAABAgA7AA==`         |
| cat_near    | `AQAAFQAAAAAWAAEBCB4BAAAAAAABAgA7AA==`         |
| cat_enter   | `AQAAFQAAAAAWAAABCB4BAAAAAAABAgA7AA==`         |
| After clean | `AQAAFQAAAAAWAAAACB4BAAAAAAABAgA8AA==`         |

**Data-byte layout (index after the 4-byte header):**

| Byte | Meaning | Values |
|------|---------|--------|
| 0  | waste bin full | 1 = full |
| 1  | waste drawer removed | 1 = removed |
| 2  | lid / cover open | 1 = open |
| 3  | weight unit | 0 kg, 1 lb |
| 4  | quiet-period start hour | 0–23 |
| 5  | quiet-period start minute | 0–59 |
| 6  | cat `isIn` | |
| 7  | cat `isNear` | |
| 8  | quiet-period stop hour | |
| 9  | quiet-period stop minute | |
| 10 | auto-clean enabled | |
| 11 | soft clumps mode enabled | |
| 12 | quiet period (sleep mode) enabled | |
| 13 | auto screen-off enabled | |
| 14 | child lock enabled | |
| 15 | litter type | 0 Pawbby Natural, 1 Tofu, 2 Bentonite, 3 Mixed — all four confirmed on hardware |
| 16 | auto-clean delay (minutes) | 1–60 (factory 1) |
| 17 | litter level | 0 empty, 1 low, 2 enough |
| 18 | (not used by the app) | |
| 19 | deodorant pod days left | e.g. 0x3b = 59 |
| 20 | cat inside for a long time | 1 = warning |

Example: idle sample above → bin ok, kg, quiet period 22:00–08:30 **disabled**, auto-clean on, delay 1 min, litter type 0, litter level 2, deodorant 59 days.

#### DP 105 — Settings (设备控制 / `deviceGate`) ✅ CONFIRMED ON HARDWARE (2026-10-07)
Frame: `01 <gate> <len:2 BE> <data>` (base64 on the wire). Full details, payload tables and ACK behaviour in
[`DP105_SETTINGS.md`](DP105_SETTINGS.md).

| Gate | Setting | Payload | Example |
|------|---------|---------|---------|
| 00 | Auto-clean on/off | `01 00 00 01 0x` | on `AQAAAQE=` / off `AQAAAQA=` |
| 01 | Soft clumps mode | `01 01 00 01 0x` | on `AQEAAQE=` |
| 02 | Quiet period / sleep mode on/off | `01 02 00 01 0x` | on `AQIAAQE=` |
| 03 | Auto screen-off | `01 03 00 01 0x` | on `AQMAAQE=` |
| 04 | Child lock | `01 04 00 01 0x` | on `AQQAAQE=` |
| 05 | Litter type (0–3) | `01 05 00 01 id` | bentonite `AQUAAQI=` |
| 06 | **Auto-clean delay** (1–60 min) | `01 06 00 01 mm` | 5 min `AQYAAQU=` |
| 07 | **Quiet period window** | `01 07 00 04 sh sm eh em` | 22:00–08:30 `AQcABBYACB4=` |
| 08 | Reset deodorant counter | `01 08 00 00` | `AQgAAA==` |
| 09 | Time zone (UTC offset, hours) | `01 09 00 01 tz` | UTC+2 `AQkAAQI=` |
| 0A | Weight unit | `01 0A 00 01 0x` | kg `AQoAAQA=` / lb `AQoAAQE=` |

Each write is acknowledged with an enum on DP 115 (and `deodorant_reset` on DP 114 for gate 08), the numeric payload
on DP 113, and a fresh DP 103 snapshot. ⚠️ The earlier "modes 01–03 on DP 105" sweep payloads were valid settings writes
that switched soft clumps / quiet period / auto screen-off **off**.

#### DP 106 — Main command trigger (工作状态 / "Work status")
- Payload format: 4 or 5 bytes
  - Standard command: `[01][mode][00][00]` or `[01][mode][00][01][00]`

**Confirmed command modes (sent by us / community → state observed):**

| Payload      | Bytes              | Result                                 | Notes |
|--------------|--------------------|----------------------------------------|-------|
| `AQAAAA==`   | 01 00 00 00        | `work_mclean` = MANUAL CLEAN ✅ (confirmed) | Starts ~119s clean cycle immediately; ends with DP 102 (credit: @managementboy) |
| `AQEAAQA=`   | 01 01 00 01 00     | `work_smooth` = FLATTEN ✅ (confirmed) | Levels litter surface |
| `AQIAAQA=`   | 01 02 00 01 00     | `work_empty` = EMPTY/DUMP ✅ ⚠️ BE CAREFUL | Dumps all litter into waste bin |
| `AQMAAQA=`   | 01 03 00 01 00     | `cat_near` = side effect, not useful  | |
| `AQQAAQA=`   | 01 04 00 01 00     | `cat_near_leave` = side effect        | |
| `01 01 00 00`| 01 01 00 00        | `startFP` from APK notes (untested)   | |
| `01 03 00 00`| 01 03 00 00        | `cancelClear` from APK notes (untested) | |
| modes 05–12  |                    | `work_idle` = no effect               | |
| integer 1–6  |                    | `work_idle` = no effect               | |

> ℹ️ **Note on `work_mclean` discovery:** The original DP 106 sweep started at byte `01` (`AQEAAQA=`), which missed byte `00` (`AQAAAA==`). Thanks to @managementboy, remote manual clean via `AQAAAA==` (`startClear = 01000000` in APK decompilation) is confirmed working! Always verify box is idle and no cat is present before sending.

**Reported BY device itself (echo on status changes):**

| Payload    | Bytes          | Meaning                                         |
|------------|----------------|-------------------------------------------------|
| `AQAAAQA=` | 01 00 00 01 00 | `work_idle` = standby                           |
| `AQIAAQA=` | 01 02 00 01 00 | `work_aclean` = AUTO clean (device self-triggers)|

#### DP 107 — Cat visit data reporter (如厕数据 / "Toilet data")
- ✅ CONFIRMED as 如厕数据 DP
- Broadcasts ONLY when cat has a real interaction (not just a peek/cat_near)
- Fires just before auto-clean (`work_aclean`) is triggered
- Timing: broadcasts ~at `cat_near_leave`, then `work_aclean` fires ~70s later
- NOT triggered for quick `cat_near`-only visits (cat just sniffs, doesn't enter)
- Value format: base64 string decoding to `01 00 00 05 [WW WW] 00 [xx] 00` (length 9 bytes)
  - Bytes 0–3: `01 00 00 05`
  - Bytes 4–5: Big-endian 16-bit uint = **Cat's weight in grams** (credit: discovered & verified by @managementboy)
  - Byte 6: `00`
  - Byte 7: `xx` = **Visit duration in seconds** (credit: @managementboy, confirmed across real-world visits)
  - Byte 8: `00`

**Validation Dataset (from @managementboy, 2 cats across 24h):**

| Time (local) | Payload        | Bytes                       | Weight | Byte 7 (XX) | Duration | Cat     |
|--------------|----------------|-----------------------------|--------|-------------|----------|---------|
| 17.09 15:44  | `AQAABRKJACIA` | 01 00 00 05 12 89 00 22 00  | 4745 g | `0x22` = 34 | 34s      | (heavy) |
| 17.09 19:00  | `AQAABRKyADgA` | 01 00 00 05 12 b2 00 38 00  | 4786 g | `0x38` = 56 | 56s      | (heavy) |
| 17.09 20:30  | `AQAABRKaACsA` | 01 00 00 05 12 9a 00 2b 00  | 4762 g | `0x2b` = 43 | 43s      | (heavy) |
| 17.09 21:41  | `AQAABQ/7AAsA` | 01 00 00 05 0f fb 00 0b 00  | 4091 g | `0x0b` = 11 | 11s      | (light) |
| 18.09 05:54  | `AQAABRASABsA` | 01 00 00 05 10 12 00 1b 00  | 4114 g | `0x1b` = 27 | 27s      | (light) |
| 18.09 06:08  | `AQAABRATAAsA` | 01 00 00 05 10 13 00 0b 00  | 4115 g | `0x0b` = 11 | 11s      | (light) |
| 18.09 06:13  | `AQAABRJ2AAwA` | 01 00 00 05 12 76 00 0c 00  | 4726 g | `0x0c` = 12 | 12s      | (heavy) |

**Key Observations:**
- **Grams Hypothesis Solidified:** Weights fall into two razor-sharp clusters (~4.73 kg vs ~4.11 kg) with within-cluster spread < 70 g and ~610 g between them. Also precisely matches physical scale-peak readings (e.g. 4786 g DP 107 vs ~4769 g physical scale).
- **Byte 7 (XX) = Duration:** The spread of values (11, 12, 27, 34, 43, 56) tracks elapsed visit presence time in seconds, reflecting how long the cat dwelled inside the drum.

#### DP 109 — Weight calibration / Tare (称重校准 / "Weight cal")
- Payload: `AQEAAA==` (bytes: `01 01 00 00`, matching `resetWeight = createValue(1, 0, 1)`)
- ✅ CONFIRMED working (credit: @managementboy): zeroes/tares the load cells.
- Box responds with empty ACK on Tuya command `0x0d`.

#### DP 108, 110
- DP 108: `device_info` (e.g. `AQAAEk1HUzEwNDA0MjUwNDE4MDA0NA==`)
- DP 110: `calibrat_result` (calibration result: `AQEAAQA=`)

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
- At idle: same value as DP 111 (e.g. 4049, raw ADC tare offset)
- During an active cat visit (`cat_enter` → `cat_leave`): **reports the live cat weight in grams** directly calculated by firmware (e.g. 4248g)
- Resets to 0 when cat leaves (`cat_near_leave` event)
- Also carries the numeric payload of DP 115 settings ACKs (e.g. `2` after a time-zone push, `60` after a deodorant reset) — ignore those samples for weight tracking.

#### DP 114 — Event flag 1 (`data_flag_01`)
- Values seen: `"motor_ok"`, `"deodorant_reset"` (echoed after a DP 105 gate-08 deodorant reset)
- ⚠️ Not a pure motor-health field — treat only fault-looking values as motor errors (Pawbby Reborn used to lock the controls on anything ≠ `motor_ok`; fixed 2026-10-07).
- Sticky: stays on `deodorant_reset` (re-sent with every status push) until the next motor event — observed reverting to `motor_ok` when a clean cycle completed.

#### DP 115 — Settings ACK enum (`data_flag_02`)
- Echoes which setting was just changed on DP 105; the numeric payload (if any) arrives on **DP 113** at the same time:

| DP 115 value | Triggered by | DP 113 |
|--------------|--------------|--------|
| `nodisturb_time` | quiet-period window (gate 07) | — |
| `nodisturb_mode_enable` / `nodisturb_mode_disable` | quiet period on/off (gate 02) | — |
| `stool_mode_enable` / `stool_mode_disable` | soft clumps (gate 01) | — |
| `auto_screen_enable` / `auto_screen_disable` | auto screen-off (gate 03) | — |
| `child_lock_enable` / `child_lock_disable` | child lock (gate 04) | — |
| `time_zone` | time-zone push (gate 09) | UTC offset (e.g. `2`) |
| `deodorant_days` | deodorant reset (gate 08) | days left (`60`) |
| `cat_litter_pawbby` / `cat_litter_tofe` (sic) / `cat_litter_bentonite` / `cat_litter_mix` | litter type (gate 05) ids 0 / 1 / 2 / 3 | — |

- Earlier note "DP 115 reports the deodorant days as a number" was a misread: DP 115 is the label, the number is on DP 113. The persistent days counter lives in DP 103 byte 19.

#### DP 116 — Device state machine (数据标志03 / "Data flag 03")
- **READ-ONLY** reporting DP
- All known states:

| State                | Description                                                          |
|----------------------|----------------------------------------------------------------------|
| `work_idle`          | idle / standby                                                       |
| `cat_near`           | cat approaching, detected near box                                   |
| `cat_enter`          | cat is inside using the box                                          |
| `cat_leave`          | cat stepping out (weight dropping)                                   |
| `cat_near_leave`     | cat has fully left the sensor range                                  |
| `work_smooth`        | FLATTEN / leveling litter (triggered via DP 106)                     |
| `work_aclean`        | AUTOMATIC clean (~1 min after cat visit, device self-triggers)      |
| `work_mclean`        | MANUAL clean (triggered via DP 106 `AQAAAA==` ✅)                    |
| `work_empty`         | EMPTY / dump litter (triggered via DP 106 ⚠️)                        |
| `work_dumping`       | Intermediate drum tilting/dumping phase                              |
| `work_resetting`     | Drum homing / resetting phase                                        |
| `lid_open`           | Top lid / cover removed (freezes DP 112 scale reading!)              |
| `lid_close`          | Top lid / cover closed                                               |
| `roller_uninstall_ok`| Drum / roller removed from chassis (cleaning / maintenance)          |
| `collect_install`    | Waste drawer pulled out / removed                                    |
| `collect_full`       | Waste bin full                                                       |
| `collect_normal`     | Waste bin normal (not full)                                          |
| `cat_litter_little`  | Litter level is low (sensor alert)                                   |
| `cat_litter_enough`  | Litter level sufficient / restored                                  |

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

### ~~Unknown DP (number not confirmed)~~ → resolved: this is DP 107

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

## Protocol Architecture & Firmware Quirks (Reverse Engineering Notes)

### 1. Command Encoding (`createValue`)
From APK decompilation (credit: @managementboy), command bytes follow the structure:
`createValue(version, len, cmd, data)` = `[ver (1B)][cmd (1B)][len (2B, big-endian = number of data bytes)][data]`
> ✏️ **Correction (2026-10-07):** the 2-byte field previously called "flag" is the **payload length** (`parseValueToObj` reads it back as `len`). That is why `01 01 00 01 00` (len 1, data `00`) and `01 01 00 00` (len 0) both mean "startFP".
- **Clean Now** (`startClear`): `(1, 0, 0)` → `01 00 00 00` (`AQAAAA==`) on DP 106
- **Tare / Zero Scale** (`resetWeight`): `(1, 1, 0)` → `01 01 00 00` (`AQEAAA==`) on DP 109
- **Cancel Clean** (`cancelClear`): `(1, 3, 0)` → `01 03 00 00` (`AQMAAA==`) on DP 106 (from APK decompilation)
- **Flatten / Level** (`startFP`): `(1, 1, 0)` → `01 01 00 01 00` (`AQEAAQA=`) on DP 106
- **Empty Tray**: `(1, 2, 0)` → `01 02 00 01 00` (`AQIAAQA=`) on DP 106

### 2. Live Cat Weight Reporting (DP 113)
During an active cat visit (`cat_enter` → `cat_leave`), **DP 113 directly reports the live cat weight in grams** as calculated by the box firmware (e.g. `4248` matching DP 107). It resets to `0` when `cat_near_leave` fires.

### 3. "Lid Open Freezes DP 112" & Refill Trap
- When the top cover/lid is opened (`lid_open`), **DP 112 readings are latched/frozen** by the firmware. Identical readings over minutes do not indicate a steady measurement.
- Human approach triggers `cat_near`; pouring in fresh litter increases weight. If `lid_open` is active, visit weight measurement must be discarded to prevent litter refills being falsely recorded as cat visits.

### 4. `cat_near_leave` vs Presence
- `cat_near_leave` indicates the cat has already stepped away from the scale sensor area.
- It must not be treated as `cat_present = true`, otherwise presence stays latched on and delays closing the measurement window.

### 5. Split Visit Window
- Cats frequently step out for 5–15 seconds and step right back in.
- If `cat_near` or `cat_enter` reoccurs within 15 seconds of `cat_near_leave`, merging into the same visit prevents fragmented logs.

### 6. Local Tuya v3.4 Transport Notes
- TCP Port 6668.
- The box allows strictly **one TCP connection at a time**; the vendor mobile app must be closed.
- Keepalive: connections drop after ~30s idle, so a heartbeat (cmd `0x09` with `{}`) is required every 10s.
- Status queries: responds to `DP_QUERY` (`0x0a`); ignores `DP_QUERY_NEW` (`0x10`).
- Writes: command `0x0d` (`CONTROL_NEW`) requires a 15-byte prefix (`"3.4"` followed by 12 null bytes).

### 7. Native Litter Level Detection (`cat_litter_little` & `cat_litter_enough`)
- Firmware directly reports litter level status via DP 116 enums:
  - `cat_litter_little`: Box optical/load sensors detect low litter.
  - `cat_litter_enough` (or prefix `cat_litter_eno*`): Box detects adequate litter level.
- Replaces previous heuristics (such as inspecting raw weight < 1500g or misinterpreting DP 102).

### 8. Drum Removal Detection (`roller_uninstall_ok`)
- When the rotating drum/roller is unlatched and lifted out for washing/cleaning, DP 116 reports `roller_uninstall_ok`.
- Safe systems should flag the box as "Drum Removed" and refuse any remote motor commands (`clean`, `flatten`, `empty`, `tare`) while in this state.

### 9. Multi-Cat Weight Clustering (1-D 2-Means)
- Reverse-engineered in @managementboy's `pawbby_resident.lua`:
  - Collects recent visit weights (e.g. latest 60 samples from DP 107 / scale peaks).
  - Evaluates all `n - 1` split points of sorted weights to minimize Sum of Squared Errors (SSE).
  - Validation test: Enforces cluster separation `(mean_high - mean_low) >= max(400g, 4 * sd)`.
  - If a home only has one cat (or weights are too close to distinguish safely), the standard deviation test prevents the system from hallucinating two different cats.

---

## Acknowledgements & Community Contributions
Special thanks to **[@managementboy](https://github.com/managementboy/pawbby)** for reverse-engineering and field-testing the KNX / LogicMachine local Tuya v3.4 implementation, discovering the remote clean (`01 00 00 00`) & tare (`01 01 00 00`) payloads, decoding the DP 107 byte structure (weight in grams + dwell duration in seconds), clarifying DP 102 / DP 115 / DP 116 states, and documenting firmware quirks.
- Upstream Repository: [managementboy/pawbby](https://github.com/managementboy/pawbby)
- Data Points Reference: [docs/DATAPOINTS.md](https://github.com/managementboy/pawbby/blob/main/docs/DATAPOINTS.md)
- Resident Script: [`src/pawbby_resident.lua`](https://github.com/managementboy/pawbby/blob/main/src/pawbby_resident.lua)

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
CLEAN:    device.set_value('106', 'AQAAAA==')  → work_mclean ✅ (credit: @managementboy)
TARE:     device.set_value('109', 'AQEAAA==')  → zero scale / tare ✅ (credit: @managementboy)
CANCEL:   device.set_value('106', 'AQMAAA==')  → cancel clean cycle
FLATTEN:  device.set_value('106', 'AQEAAQA=')  → work_smooth
EMPTY:    device.set_value('106', 'AQIAAQA=')  → work_empty  ⚠️ clears everything
SETTINGS: device.set_value('105', 'AQYAAQU=')  → auto-clean delay 5 min ✅ (all gates, see DP 105 section)
QUIET:    device.set_value('105', 'AQcABBYACB4=') + 'AQIAAQE='  → quiet period 22:00–08:30, enabled ✅
STATUS:   device.status()                       → DP 111–117
MONITOR:  listen_button.py                      → all broadcasts in real-time
```

---

## ℹ️ Historical Note: `work_mclean` Discovery

> ⚠️ **HISTORICAL NOTE (SUPERSEDED):** Early sweeps tested modes 01–30 on DP 106 and concluded `work_mclean` could not be triggered. However, @managementboy decompiled the Android bundle and discovered `startClear` (`01 00 00 00` = `AQAAAA==`), which uses command word `00`. Remote manual cleaning is **100% functional** and integrated into Pawbby Reborn! Tare / zero scale was similarly unlocked via DP 109 `AQEAAA==` (`01 01 00 00`).

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

### Command Number Mapping (`LitterBoxCommand` enum) — these ARE the Tuya DP ids
> ✏️ **Correction (2026-10-07):** `publishCommand()` in the bundle calls the native `TYManager.publishCommand`, which does `ITuyaDevice.publishDps('{"<number>": "<hex>"}')`. The Tuya SDK converts the hex string to bytes and base64 for raw DPs (`DevUtil.encodeRaw`) and the reverse on receive. So 101–118 are the local Tuya DP numbers, not a separate STOMP numbering, and every "STOMP body" below maps 1:1 onto `device.set({ dps, set: base64(hex) })`.

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

### Payload Format — `createValue(ver, len, commandWord, data)`

```
Payload = formatNum(ver,2) + formatNum(commandWord,2) + formatNum(len,4) + data
```
(All numbers converted to hex, zero-padded to specified digit count; `len` = number of data bytes)

### Cleaning Commands — topic 106 (`clearControl`)

| Command      | Function                  | Payload      | Full STOMP body                    |
|--------------|---------------------------|--------------|------------------------------------|
| startClear   | MANUAL CLEAN START        | `"01000000"` | `{"clearControl": "01000000"}`     |
| startFP      | FIXED POINT / SPOT CLEAN  | `"01010000"` | `{"clearControl": "01010000"}`     |
| cancelClear  | CANCEL/STOP CLEAN         | `"01030000"` | `{"clearControl": "01030000"}`     |

### Settings — DP 105 (`deviceGate`)

```js
DeviceGateType = { AutoClear:0, RBCompatible:1 /* soft clumps */, Disturb:2 /* quiet period */, AutoOffScreen:3,
                   ChildLock:4, LitterType:5, SetAutoClearTime:6, SetDisturbTime:7, ResetDeodorant:8,
                   SyncTimeZone:9, SetWeightUnit:'0A' }

setGateValue(uuid, gate, value):  value === '-' ? createValue(1, 0, gate, '') : createValue(1, 1, gate, hex2(value))
setSleepTime(uuid, sh, sm, eh, em): "01" + "07" + "0004" + hex2(sh) + hex2(sm) + hex2(eh) + hex2(em)
setAutoTime(uuid, minutes):        setGateValue(uuid, SetAutoClearTime, minutes)   // picker 1..60
syncTimeZone(uuid):                createValue(1, 1, SyncTimeZone, hex2(-getTimezoneOffset()/60))  // app sends on every connect
setWeightUnit(uuid, unit):         createValue(1, 1, SetWeightUnit, hex2(unit))     // 0 kg, 1 lb; app auto-corrects from DP 103 byte 3
```
UI strings: "Auto-clean delay — How long should the litter box wait to auto-clean after your cat exits",
"Sleep mode — The device will pause auto-clean during the set time period" (hint: window of 1–12 h), defaults 22:00–08:30.

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

> ~~**IMPORTANT:** Local DPS are 111–117, NOT the STOMP topic numbers (101–118). They are different numbering systems!~~
> ✏️ **Corrected 2026-10-07:** they are the same numbering. 101–110 are raw/push DPs that simply don't appear in `status()`; 111–117 are the only ones `DP_QUERY` returns.

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
