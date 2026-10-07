# Pawbby Litter Box — Settings Protocol (DP 105 `deviceGate` / DP 103 `deviceStatus`)

*Reverse-engineered from the PAWBBY 3.0.5 litter-box plugin bundle + native `TYManager` module, 2026-10-07.*

> Copyright note: no app source is reproduced here; only the protocol derived from it.

This covers the two features Pawbby-Reborn was missing — **auto-clean delay** ("Auto-clean delay" in the app)
and **quiet period** ("Sleep Mode" / "Do Not Disturb at Night") — plus the other switches that live on the same DP.

---

## 1. Transport: the app talks plain Tuya DPs, in hex

The plugin's `LitterBoxCommand` numbers (101–118) **are the local Tuya DP ids** — not a separate STOMP numbering.
`publishCommand()` in the RN bundle calls the native `TYManager.publishCommand`, which does
`ITuyaDevice.publishDps('{"105": "<hex>"}')`. For raw-type DPs the Tuya SDK (`DevUtil.encodeRaw`) converts the hex string
to bytes and base64-encodes it for the wire; incoming raw DPs are base64-decoded to hex (`DevUtil.decodeRaw`) before the JS sees them.

So, for tuyapi / tinytuya:

```
app hex "0106000105"  →  bytes 01 06 00 01 05  →  base64 "AQYAAQU="  →  device.set({ dps: 105, set: "AQYAAQU=" })
```

### Frame format (`createValue`) — corrected

```
[ver=01][commandWord 1B][len 2B big-endian][data len bytes]
```

The 2-byte field previously documented in VALUES.md as a "flag" is actually the **payload length** in bytes
(`parseValueToObj` reads it back as `len`). That is why `01 01 00 01 00` (len=1, data=00) and `01 01 00 00` (len=0) both
mean "startFP".

---

## 2. DP 105 — `deviceGate` command words

```js
DeviceGateType = {
  AutoClear: 0,        // auto-clean on/off
  RBCompatible: 1,     // "Soft Clumps Mode" (shake 2–4× before cleaning)
  Disturb: 2,          // Sleep mode / Do-Not-Disturb on/off
  AutoOffScreen: 3,    // auto screen-off (5 min)
  ChildLock: 4,        // screen lock
  LitterType: 5,       // litter type index (from setup wizard)
  SetAutoClearTime: 6, // ★ auto-clean delay, minutes
  SetDisturbTime: 7,   // ★ sleep / quiet period start+stop time
  ResetDeodorant: 8,   // reset deodorant pod counter (60 days)
  SyncTimeZone: 9,     // UTC offset in hours (signed, hex)
  SetWeightUnit: 0x0A  // 0 = kg, 1 = lb
}
```

Two encodings are used:

| Kind | Builder | Bytes |
|------|---------|-------|
| 1-byte setting (gates 0–6, 9, 0A) | `createValue(1, 1, gate, hex2(value))` | `01 gg 00 01 vv` |
| no-payload action (gate 8) | `createValue(1, 0, gate, '')` | `01 gg 00 00` |
| 4-byte time range (gate 7) | manual: `01 07 0004 hh mm hh mm` | `01 07 00 04 sh sm eh em` |

### ★ Auto-clean delay (gate 6)

*"How long should the litter box wait to auto-clean after your cat exits"* — picker offers **1…60 minutes**, 1-minute steps.
Firmware default observed = 1 min (matches the ~70 s auto-clean seen in listener logs).

```
01 06 00 01 <minutes>
```

| Minutes | Hex | base64 (tuyapi `set`) |
|---------|-----|------------------------|
| 1  | `0106000101` | `AQYAAQE=` |
| 5  | `0106000105` | `AQYAAQU=` |
| 10 | `010600010a` | `AQYAAQo=` |
| 15 | `010600010f` | `AQYAAQ8=` |
| 30 | `010600011e` | `AQYAAR4=` |
| 60 | `010600013c` | `AQYAATw=` |

### ★ Quiet period / Sleep mode (gates 2 + 7)

Two separate commands: gate 7 sets the window, gate 2 turns the feature on/off. App toast when enabled:
*"The device will pause auto-clean during the set time period."* Pickers: hour 00–23, minute 00–59.
The app has a (disabled) validation string "Please set a time period within 1–12 hours", so the firmware may reject
longer spans — untested.

```
Set window:  01 07 00 04 <start_h> <start_m> <stop_h> <stop_m>     (all 1-byte binary, NOT BCD)
Enable:      01 02 00 01 01
Disable:     01 02 00 01 00
```

| Action | Hex | base64 |
|--------|-----|--------|
| Window 22:00 → 08:30 (factory default) | `010700041600081e` | `AQcABBYACB4=` |
| Window 23:30 → 07:00 | `01070004171e0700` | `AQcABBceBwA=` |
| Sleep mode ON | `0102000101` | `AQIAAQE=` |
| Sleep mode OFF | `0102000100` | `AQIAAQA=` |

The sleep flag is also mirrored by the firmware on **DP 115** as the enum `nodisturb_mode_enable` / `nodisturb_mode_disable`
(VALUES.md already logged `nodisturb_mode_disable`).

### Other switches (same encoding)

| Setting | ON | OFF |
|---------|----|-----|
| Auto-clean (gate 0) | `AQAAAQE=` | `AQAAAQA=` |
| Soft Clumps Mode (gate 1) | `AQEAAQE=` | `AQEAAQA=` |
| Auto screen-off (gate 3) | `AQMAAQE=` | `AQMAAQA=` |
| Child lock (gate 4) | `AQQAAQE=` | `AQQAAQA=` |
| Reset deodorant pod (gate 8) | `AQgAAA==` (`01080000`) | — |
| Sync time zone UTC+2 (gate 9) | `AQkAAQI=` (`0109000102`) | — (value = `(-getTimezoneOffset()/60).toString(16)`, so UTC-5 would be sent as the JS string "-5" → the app's `formatNum` behaviour for negatives is dubious; test before relying on it) |
| Weight unit kg / lb (gate 0A) | `AQoAAQA=` / `AQoAAQE=` | |

> ⚠️ Earlier DP-sweep scripts sent "modes 01–03 as base64" to DP 105 looking for a clean trigger. Those payloads
> (`0101000100`, `0102000100`, `0103000100`) are valid **settings writes** that turn OFF Soft Clumps, Sleep mode and
> Auto screen-off respectively. If someone ran that sweep, those settings may have been changed on their box.

The "Kitten mode" in the app is purely app-side: it just sends `AutoClear = 0` (gate 0) and stores a flag locally.

---

## 3. DP 103 — `deviceStatus` blob: reading the current settings back

Every DP 103 broadcast (every ~10 min and on each state change) carries the full settings snapshot. Decode base64 → bytes;
skip the 4-byte header `01 00 00 15` (len 0x15 = 21 data bytes). Offsets below are **data-byte indices** (the app indexes
the hex string, so app offset = 2 × index):

| Byte | Meaning (as used by the app) | Notes |
|------|------------------------------|-------|
| 0  | waste bin full (`trashcanState`) | 1 = full → "trashcan full" warning |
| 1  | waste drawer removed | 1 → "trashcan take out" warning |
| 2  | no cover / lid open | 1 → "no cover" warning, disables buttons |
| 3  | weight unit | 0 = kg, 1 = lb |
| 4  | **sleep start hour** | |
| 5  | **sleep start minute** | |
| 6  | cat `isIn` | |
| 7  | cat `isNear` | |
| 8  | **sleep stop hour** | |
| 9  | **sleep stop minute** | |
| 10 | auto-clean enabled | |
| 11 | Soft Clumps enabled | |
| 12 | **sleep mode enabled** | |
| 13 | auto screen-off enabled | |
| 14 | child lock enabled | |
| 15 | **litter type** | 0 Pawbby Natural, 1 Tofu, 2 Bentonite, 3 Mixed (gate 5) |
| 16 | **auto-clean delay, minutes** | |
| 17 | litter level | 0 = empty, 1 = low ("not full"), 2 = enough |
| 18 | (not read by app) | |
| 19 | deodorant pod days left | e.g. 0x3b = 59 |
| 20 | cat in box for a long time | 1 → "cat long time in" warning |

Check against a real sample from VALUES.md (`AQAAFQAAAAAWAAAACB4BAAAAAAABAgA7AA==`):

```
01 00 00 15 | 00 00 00 00 16 00 00 00 08 1e 01 00 00 00 00 00 01 02 00 3b 00
              ^bin ^out ^lid ^kg 22 :00 in nr 08 :30 AC sc SL os cl -- 1m lit -- 59d long
→ sleep window 22:00–08:30, sleep OFF, auto-clean ON, delay 1 min, litter level 2 (ok), deodorant 59 days
```

This matches DP 115 = `nodisturb_mode_disable` and the observed ~1-minute auto-clean after a visit. ✅

---

## 4. Implementation in Pawbby-Reborn (2026-10-07)

| Piece | Where |
|-------|-------|
| Codec (DP 103 decode, DP 105 encode, input validation) | `web/server/utils/deviceSettings.ts` |
| Daemon write path — `tuya:setting` nitro hook, logs a `settings-changed` event | `web/server/plugins/tuya-listener.ts` |
| Settings read-back (latest DP 103 → `settings`, `settingsUpdatedAt`) | `web/server/utils/deviceState.ts` → `/api/devices`, `/api/external/state`, MQTT state payload |
| Dashboard endpoint (session auth) | `POST /api/device-settings` `{ deviceId, setting, value }` |
| External endpoint (API key) | `POST /api/external/settings` (documented in the in-app API docs page) |
| Home Assistant (MQTT discovery) | `switch` × 5 (auto-clean, sleep mode, soft clumps, auto screen-off, screen lock), `number` auto-clean delay, sensors for the sleep window; commands on `<base>/<deviceId>/set/<setting>` |
| UI | Litter box page → **Control** tab → "Device Settings" card (toggles, delay picker, quiet-period toggle that expands into the time window, deodorant counter reset). Opening the tab requests a refresh. |
| Account sync | The box's **weight unit** and **time zone** mirror the dashboard account (`user.weightUnit` / `user.timezone`): the daemon pushes the time zone on every connect, corrects the unit whenever a DP 103 snapshot disagrees (10-min cooldown), and both are re-pushed when they change in Settings. |

Setting keys accepted by the API/MQTT: `auto_clean`, `sleep_mode` (quiet period), `soft_clumps`, `auto_off_screen`,
`child_lock` (bool), `auto_clean_delay` (1–60), `sleep_window` (`{start, stop}` as `HH:MM`), `litter_type` (0–3, see
below), `reset_deodorant` (no value), `refresh` (no value).

### Litter type (gate 5)

`01 05 00 01 <id>` with the ids the vendor app's setup wizard and settings screen use: **0** Pawbby Natural (plant-based,
"recommended"), **1** Tofu, **2** Bentonite, **3** Mixed. The firmware uses the litter density for its remaining-litter
estimate ("if you change the cat litter, remember to update it"). Reported back in DP 103 data byte 15.

**Reading settings on demand:** DP 103 is push-only (not returned by `DP_QUERY`, and the vendor app only ever read it from
the SDK's cache). `refresh` re-pushes the account time zone (gate 9) — a harmless write that should make the box emit a new
snapshot; the dashboard does this each time the Control tab is opened. Whether a gate-9 write reliably triggers a DP 103
push is still to be confirmed on hardware.

The UI shows optimistic values for up to 60 s and then trusts the next DP 103 push from the box; the Tuya ACK alone is
not treated as confirmation.

---

## 5. Status: CONFIRMED on hardware (2026-10-07)

Live test from the dashboard against a real box: sleep window `23:00–09:00` (`AQcABBcACQA=`), quiet period on/off,
soft clumps, auto screen-off, child lock, auto-clean delay 20 min (`AQYAARQ=`), deodorant reset and time-zone pushes
were all accepted, and the next DP 103 snapshot echoed every value:

```
AQAAFQAAAAAXAAAACQABAAEBAQAUAgA8AA==
→ 01 00 00 15 | 00 00 00 00 17 00 00 00 09 00 01 00 01 01 01 00 14 02 00 3c 00
   sleep 23:00–09:00, autoClean=1, soft=0, sleep=1, autoScreen=1, childLock=1, delay=20, litter=2, deodorant=60
```

Pushing the time zone (gate 9) does make the box emit a fresh DP 103 within ~1 s, so the `refresh` mechanism works.

### Bonus: DP 114 / DP 115 are the firmware's ACK channel

Each DP 105 write is echoed as an enum on **DP 115** (`data_flag_02`), with the numeric payload on **DP 113**:

| Write | DP 115 echo | DP 113 |
|-------|-------------|--------|
| sleep window (gate 7) | `nodisturb_time` | — |
| quiet period on/off (gate 2) | `nodisturb_mode_enable` / `nodisturb_mode_disable` | — |
| soft clumps (gate 1) | `stool_mode_enable` / `stool_mode_disable` | — |
| auto screen-off (gate 3) | `auto_screen_enable` / `auto_screen_disable` | — |
| child lock (gate 4) | `child_lock_enable` / `child_lock_disable` | — |
| time zone (gate 9) | `time_zone` | offset (e.g. `2`) |
| deodorant reset (gate 8) | `deodorant_days` | days left (`60`) |

The deodorant reset is **also** echoed on **DP 114** (`data_flag_01`) as `deodorant_reset`. DP 114 is therefore an
event flag rather than a pure motor-health status; code that treated anything other than `motor_ok` as a motor error
(Pawbby-Reborn did) locks out the controls after a pod reset. Fixed in `deviceState.ts` to flag only fault-looking values.

Remaining uncertainty: negative UTC offsets for the time-zone push (we send the two's-complement byte; the vendor app
itself produced malformed hex for those).
