import TuyaDevice from "tuyapi";
import prisma from "../utils/prisma";

export default defineNitroPlugin((nitroApp) => {
  interface DeviceState {
    baseWeight: number;
    currentStatus: string;
    isBinFull: boolean;
    isLitterLow?: boolean;
    isDrumRemoved?: boolean;
    catEnteredAt: number | null;
    peakWeight: number;
    pendingLitterCheck: boolean;
    lastFlattenTime: number;
    lastCleanTime: number;
    lastEmptyTime: number;
    lastCatLeaveTime: number;
    lidOpenedDuringVisit?: boolean;
    lastVisitEndedAt?: number;
    lastVisitEndWeight?: number;
  }

  const VISIT_STATUSES = new Set([
    "cat_enter",
    "cat_near",
    "cat_near_leave",
    "cat_leave",
  ]);

  const BUSY_STATUSES = new Set([
    "unknown",
    "cat_enter",
    "cat_near",
    "cat_near_leave",
    "cat_leave",
    "lid_open",
    "collect_install",
    "roller_uninstall_ok",
    "work_smooth",
    "work_aclean",
    "work_mclean",
    "work_empty",
    "work_dumping",
    "work_resetting",
  ]);

  const activeDevices = new Map<string, any>();
  const retryTimeouts = new Map<string, any>();
  const pingIntervals = new Map<string, any>();
  const deviceStates = new Map<string, DeviceState>();
  const appTriggeredActions = new Map<string, number>();

  const dispatchWebhook = async (user: any, message: string, eventType: string) => {
    if (!user?.webhookUrl) return;
    
    // Check user preferences
    if (eventType === 'visit' && !user.notifyPushVisit) return;
    if (eventType === 'auto-clean' && !user.notifyPushAutoClean) return;
    if (eventType === 'manual-clean' && !user.notifyPushManualClean) return;
    if (eventType === 'empty' && !user.notifyPushEmpty) return;
    if (eventType === 'flatten' && !user.notifyPushFlatten) return;
    if (eventType === 'error' && !user.notifyPushError) return;

    try {
      const url = new URL(user.webhookUrl);
      if (process.env.WEBHOOK_STRICT_MODE === 'true') {
        const allowedHosts = ['hooks.slack.com', 'discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com', 'api.telegram.org', 'api.pushover.net'];
        if (url.protocol !== 'https:' || !allowedHosts.includes(url.host)) {
          throw new Error('Strict mode enabled: Webhook URL must be a valid, known secure webhook (Discord, Slack, Telegram, Pushover) over HTTPS.');
        }
      } else {
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
          throw new Error('Invalid webhook protocol. Must be http or https.');
        }
        const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254']);
        if (blockedHosts.has(url.hostname)) {
          throw new Error('Loopback and metadata webhook addresses are not allowed for security reasons.');
        }
      }

      const payload = { content: message, text: message };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      fetch(user.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).catch(e => console.error('[Webhook Error]', e.message))
        .finally(() => clearTimeout(timeout));
    } catch (err: any) {
      console.error('[Webhook Configuration Error]', err.message);
    }
  };

  const recordEvent = async (payload: {
    type?: string;
    deviceId?: string;
    petId?: string | null;
    weight?: number | null;
    duration?: number | null;
    rawData?: string | null;
    data?: any;
  }) => {
    const data = payload.data || payload;
    const event = await prisma.litterEvent.create({ data });
    nitroApp.hooks.callHook("device:event" as any, {
      deviceId: data.deviceId,
      type: data.type,
      petId: data.petId,
      weight: data.weight,
      duration: data.duration,
      timestamp: event.timestamp.toISOString(),
    });
    return event;
  };

  const startTuyaListener = async () => {
    try {
      const devices = await prisma.device.findMany({
        where: { mode: "local" },
      });

      // Disconnect all existing devices
      for (const [id, device] of activeDevices.entries()) {
        try {
          device.disconnect();
        } catch (e) {}
      }
      activeDevices.clear();

      // Clear timeouts and intervals
      for (const [id, timeoutId] of retryTimeouts.entries()) {
        clearTimeout(timeoutId);
      }
      retryTimeouts.clear();

      for (const [id, intervalId] of pingIntervals.entries()) {
        clearInterval(intervalId);
      }
      pingIntervals.clear();

      for (const config of devices) {
        if (!config.deviceId || !config.localKey) continue;

        console.log(`[Tuya] Starting local daemon for Device: ${config.name}`);

        const currentDevice = new TuyaDevice({
          id: config.deviceId,
          key: config.localKey,
          ip: config.ipAddress || undefined,
          version: 3.4,
          issueRefreshOnConnect: true,
        });

        activeDevices.set(config.id, currentDevice);

        // Initialize state
        if (!deviceStates.has(config.id)) {
          const latestCollectFull = await prisma.litterEvent.findFirst({
            where: {
              deviceId: config.id,
              OR: [
                { type: "bin-full" },
                { type: "tuya-raw-data", rawData: { contains: '"collect_full"' } },
              ],
            },
            orderBy: { timestamp: "desc" },
          });

          let initialBinFull = false;
          if (latestCollectFull) {
            const latestClear = await prisma.litterEvent.findFirst({
              where: {
                deviceId: config.id,
                OR: [
                  { type: "bin-normal" },
                  { type: "bin-replaced" },
                  { type: "tuya-raw-data", rawData: { contains: '"collect_normal"' } },
                ],
              },
              orderBy: { timestamp: "desc" },
            });
            if (!latestClear || latestCollectFull.timestamp.getTime() > latestClear.timestamp.getTime()) {
              initialBinFull = true;
            }
          }

          // Restore latest DP 116 state from DB so we fail closed if the box is disassembled/busy/opened
          const latestDP116Event = await prisma.litterEvent.findFirst({
            where: {
              deviceId: config.id,
              type: "tuya-raw-data",
              rawData: { contains: '"116"' },
            },
            orderBy: { timestamp: "desc" },
          });

          let initialStatus = "unknown";
          let initialDrumRemoved = false;
          let initialLitterLow = false;

          if (latestDP116Event?.rawData) {
            try {
              const parsed = JSON.parse(latestDP116Event.rawData);
              if (parsed?.dps?.["116"]) {
                const st = String(parsed.dps["116"]);
                initialStatus = st;
                if (st === "roller_uninstall_ok") initialDrumRemoved = true;
                if (st === "cat_litter_little") initialLitterLow = true;
              }
            } catch (e) {}
          }

          deviceStates.set(config.id, {
            baseWeight: 0,
            currentStatus: initialStatus,
            isBinFull: initialBinFull,
            isLitterLow: initialLitterLow,
            isDrumRemoved: initialDrumRemoved,
            catEnteredAt: null,
            peakWeight: 0,
            pendingLitterCheck: false,
            lastFlattenTime: 0,
            lastCleanTime: 0,
            lastEmptyTime: 0,
            lastCatLeaveTime: 0,
          });
        }

        currentDevice.on("disconnected", () => {
          console.log(`[Tuya] Disconnected from device ${config.name}.`);
          if (pingIntervals.has(config.id)) {
            clearInterval(pingIntervals.get(config.id));
            pingIntervals.delete(config.id);
          }
          if (!retryTimeouts.has(config.id)) {
            const timeout = setTimeout(() => {
              retryTimeouts.delete(config.id);
              // Restart all connections
              startTuyaListener();
            }, 5000);
            retryTimeouts.set(config.id, timeout);
          }
        });

        currentDevice.on("error", (error: any) => {
          console.error(`[Tuya] Error for ${config.name}!`, error);
        });

        let lastPayloadStr = "";
        let lastPayloadTime = 0;

        const handleData = async (data: any) => {
          const dataStr = JSON.stringify(data);
          const now = Date.now();

          // Deduplicate if 'data' and 'dp-refresh' both fire with the same payload
          if (dataStr === lastPayloadStr && now - lastPayloadTime < 2000) {
            return;
          }
          lastPayloadStr = dataStr;
          lastPayloadTime = now;

          // Log Raw data
          await prisma.litterEvent.create({
            data: {
              type: "tuya-raw-data",
              rawData: dataStr,
              deviceId: config.id,
            },
          });

          if (!data.dps) return;
          const dps = data.dps;
          const state = deviceStates.get(config.id)!;
          let stateChanged = false;

          // 1. Confirm Completed Visit (DP 107 - toilet_data) FIRST
          if (dps["107"]) {
            let durationSecs = 60; // Fallback to 1 minute if we missed the entry event
            let weightInKg = 0;

            if (state.catEnteredAt && state.peakWeight > 0) {
              durationSecs = Math.round(
                (Date.now() - state.catEnteredAt) / 1000,
              );
              weightInKg = state.peakWeight / 1000;
            }

            // Fallback: parse firmware-reported cat weight directly from DP 107
            // Format: 01 00 00 05 [WW WW] 00 [xx] 00 (bytes 4-5 = weight in grams)
            if (typeof dps["107"] === "string") {
              try {
                const buf = Buffer.from(dps["107"], "base64");
                if (buf.length >= 6 && buf[0] === 0x01 && buf[3] === 0x05) {
                  const fwWeightGrams = buf.readUInt16BE(4);
                  if (fwWeightGrams > 500 && fwWeightGrams < 25000) {
                    if (weightInKg === 0) {
                      weightInKg = fwWeightGrams / 1000;
                    }
                  }
                  if (buf.length >= 8 && buf[7] > 0 && durationSecs === 60) {
                    durationSecs = buf[7];
                  }
                }
              } catch (e) {
                console.error("[Tuya] Error decoding DP 107 payload:", e);
              }
            }

            // PawID Matching Logic
            const pets = await prisma.pet.findMany();
            let matchedPetId = null;
            let minDiff = 0.3; // 300g threshold for matching

            if (weightInKg > 0) {
              for (const pet of pets) {
                const diff = Math.abs(pet.weight - weightInKg);
                if (diff <= minDiff) {
                  minDiff = diff;
                  matchedPetId = pet.id;
                }
              }
            }

            console.log(
              `[PawID] Toilet visit detected via DP 107! Weight: ${weightInKg}kg, Duration: ${durationSecs}s. Matched Pet: ${matchedPetId || "Unknown"}`,
            );

            await recordEvent({
              type: "toileted",
              deviceId: config.id,
              petId: matchedPetId,
              weight: weightInKg > 0 ? weightInKg : null,
              duration: durationSecs,
              rawData: JSON.stringify(dps["107"]),
            });

            // Trigger Webhook Notification
            try {
              const user = await prisma.user.findFirst();
              if (user) {
                const petName = matchedPetId ? pets.find(p => p.id === matchedPetId)?.name : 'An unknown cat';
                const min = Math.floor(durationSecs / 60);
                const sec = durationSecs % 60;
                const durStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
                
                const msg = `🐈 **${petName}** just used the litter box!\n- **Weight**: ${weightInKg.toFixed(2)}kg\n- **Duration**: ${durStr}`;
                await dispatchWebhook(user, msg, 'visit');
              }
            } catch (e) {
              console.error('[Webhook Error]', e);
            }

            // Reset visit state
            state.lastVisitEndedAt = Date.now();
            state.lastVisitEndWeight = state.peakWeight;
            state.catEnteredAt = null;
            state.peakWeight = 0;
            state.lidOpenedDuringVisit = false;
            stateChanged = true;
          }

          // 2. Update State Machine Flag (DP 116)
          if (dps["116"]) {
            const newStatus = dps["116"];

            const timeSinceAction =
              Date.now() - (appTriggeredActions.get(config.id) || 0);
            const isApp = timeSinceAction < 10000; // Within 10 seconds of clicking the app

            const now = Date.now();

            if (
              newStatus === "work_aclean" &&
              state.currentStatus !== "work_aclean"
            ) {
              if (now - state.lastCleanTime > 60000) {
                await recordEvent({
                  type: "auto-clean",
                  deviceId: config.id,
                });
                state.lastCleanTime = now;
                const user = await prisma.user.findFirst();
                if (user) await dispatchWebhook(user, "🧹 Auto-cleaning cycle started.", "auto-clean");
              }
            }
            if (
              newStatus === "work_mclean" &&
              state.currentStatus !== "work_mclean"
            ) {
              if (now - state.lastCleanTime > 60000) {
                const type = isApp ? "manual-clean-app" : "manual-clean";
                await recordEvent({
                  type,
                  deviceId: config.id,
                });
                state.lastCleanTime = now;
                const user = await prisma.user.findFirst();
                if (user) await dispatchWebhook(user, "🧹 Manual cleaning cycle started.", "manual-clean");
              }
            }
            if (newStatus === "cat_leave") {
              state.lastCatLeaveTime = now;
            }

            if (
              newStatus === "work_smooth" &&
              state.currentStatus !== "work_smooth"
            ) {
              if (now - state.lastFlattenTime > 60000) {
                let flattenType = "flatten";
                if (isApp) flattenType = "flatten-app";
                else if (now - state.lastCatLeaveTime < 5 * 60 * 1000) flattenType = "auto-flatten";

                await recordEvent({
                  type: flattenType,
                  deviceId: config.id,
                });
                state.lastFlattenTime = now;
                const user = await prisma.user.findFirst();
                if (user) await dispatchWebhook(user, "🔄 Smoothing/Flattening litter.", "flatten");
              }
            }
            if (
              newStatus === "work_empty" &&
              state.currentStatus !== "work_empty"
            ) {
              if (now - state.lastEmptyTime > 60000) {
                const type = isApp ? "empty-app" : "empty";
                await recordEvent({
                  type,
                  deviceId: config.id,
                });
                state.lastEmptyTime = now;
                const user = await prisma.user.findFirst();
                if (user) await dispatchWebhook(user, "🗑️ Emptying litter box.", "empty");
              }
            }
            if (
              newStatus === "lid_open" &&
              state.currentStatus !== "lid_open"
            ) {
              if (state.catEnteredAt) {
                state.lidOpenedDuringVisit = true;
              }
              await recordEvent({
                type: "lid-removed",
                deviceId: config.id,
              });
              const user = await prisma.user.findFirst();
              if (user) await dispatchWebhook(user, "⚠️ Top cover/lid removed from the litter box!", "error");
            }
            if (
              state.currentStatus === "lid_open" &&
              newStatus !== "lid_open"
            ) {
              await recordEvent({
                type: "lid-replaced",
                deviceId: config.id,
              });
              state.pendingLitterCheck = true;
            }

            if (
              newStatus === "collect_install" &&
              state.currentStatus !== "collect_install"
            ) {
              await recordEvent({
                type: "bin-removed",
                deviceId: config.id,
              });
              const user = await prisma.user.findFirst();
              if (user) await dispatchWebhook(user, "⚠️ Waste bin removed from the litter box!", "error");
            }
            if (
              state.currentStatus === "collect_install" &&
              newStatus !== "collect_install"
            ) {
              await recordEvent({
                type: "bin-replaced",
                deviceId: config.id,
              });
            }

            if (
              newStatus === "collect_full" &&
              !state.isBinFull
            ) {
              state.isBinFull = true;
              await recordEvent({
                type: "bin-full",
                deviceId: config.id,
              });
              const user = await prisma.user.findFirst();
              if (user) await dispatchWebhook(user, "🗑️ Waste bin is full and needs to be emptied.", "error");
            }
            if (
              newStatus === "collect_normal" &&
              state.isBinFull
            ) {
              state.isBinFull = false;
              await recordEvent({
                type: "bin-normal",
                deviceId: config.id,
              });
              const user = await prisma.user.findFirst();
              if (user) await dispatchWebhook(user, "✅ Waste bin is no longer full.", "error");
            }

            if (newStatus === "cat_litter_little" && !state.isLitterLow) {
              state.isLitterLow = true;
              await recordEvent({
                type: "litter-low",
                deviceId: config.id,
              });
              const user = await prisma.user.findFirst();
              if (user) await dispatchWebhook(user, "⚠️ Litter level is low. Please refill the litter box.", "error");
            }
            if ((newStatus === "cat_litter_enough" || newStatus.startsWith("cat_litter_eno")) && state.isLitterLow) {
              state.isLitterLow = false;
              await recordEvent({
                type: "litter-sufficient",
                deviceId: config.id,
              });
              const user = await prisma.user.findFirst();
              if (user) await dispatchWebhook(user, "✅ Litter level is sufficient.", "error");
            }

            if (newStatus === "roller_uninstall_ok" && !state.isDrumRemoved) {
              state.isDrumRemoved = true;
              await recordEvent({
                type: "drum-removed",
                deviceId: config.id,
              });
              const user = await prisma.user.findFirst();
              if (user) await dispatchWebhook(user, "⚠️ Drum/roller removed from the litter box!", "error");
            }
            if (state.isDrumRemoved && newStatus !== "roller_uninstall_ok") {
              state.isDrumRemoved = false;
              await recordEvent({
                type: "drum-installed",
                deviceId: config.id,
              });
            }

            // Quick visit detection: If it returns to idle but we were still tracking an unconfirmed visit
            if (newStatus === "work_idle" && state.catEnteredAt) {
              if (state.lidOpenedDuringVisit) {
                console.log(
                  "[PawID] Discarding quick-visit: lid was opened during window (likely litter refill).",
                );
              } else if (state.peakWeight > 0) {
                const durationSecs = Math.round(
                  (Date.now() - state.catEnteredAt) / 1000,
                );
                const weightInKg = state.peakWeight / 1000;

                const matchedPetId = null;

                // We do NOT attempt to identify the pet for quick-visits,
                // because half a heavy cat leaning in looks identical to a small cat fully inside.

                console.log(
                  `[PawID] Quick peek detected! Weight: ${weightInKg}kg, Duration: ${durationSecs}s.`,
                );

                await recordEvent({
                  data: {
                    type: "quick-visit",
                    deviceId: config.id,
                    petId: matchedPetId,
                    weight: weightInKg,
                    duration: durationSecs,
                  },
                });
              }

              // Always clear the visit window on return to idle, even when no
              // weight sample ever came in - otherwise a stale catEnteredAt
              // lingers in memory and gets wrongly attributed to a later,
              // unrelated DP 107 confirmation.
              state.lastVisitEndedAt = Date.now();
              state.lastVisitEndWeight = state.peakWeight;
              state.catEnteredAt = null;
              state.peakWeight = 0;
              state.lidOpenedDuringVisit = false;
            }

            state.currentStatus = newStatus;
            stateChanged = true;
          }

          // 3. Track Base Weight during idle (DP 112)
          if (state.currentStatus === "work_idle" && dps["112"]) {
            if (state.pendingLitterCheck && state.baseWeight > 0) {
              const diff = dps["112"] - state.baseWeight;
              if (Math.abs(diff) >= 50) { // Only log if > 50g changed
                await recordEvent({
                  data: {
                    type: diff > 0 ? "litter-added" : "litter-removed",
                    deviceId: config.id,
                    weight: Math.abs(diff) / 1000
                  },
                });
              }
              state.pendingLitterCheck = false;
            }
            state.baseWeight = dps["112"];
            stateChanged = true;
          }

          // 4. Detect Cat Entry & Track Peak Weight across the whole visit
          // (device often flips past "cat_enter" before the next DP 112/113 sample arrives)
          if (state.currentStatus === "cat_enter" && !state.catEnteredAt) {
            const now = Date.now();
            // Check if cat re-entered within 15s of leaving (split visit)
            if (
              state.lastVisitEndedAt &&
              now - state.lastVisitEndedAt < 15000 &&
              (state.lastVisitEndWeight || 0) > 0
            ) {
              console.log("[PawID] Cat re-entered within 15s - merging split visit.");
              state.peakWeight = state.lastVisitEndWeight || 0;
            } else {
              state.peakWeight = 0;
            }
            state.catEnteredAt = now;
            state.lidOpenedDuringVisit = false;
            stateChanged = true;
          }

          if (
            state.catEnteredAt &&
            VISIT_STATUSES.has(state.currentStatus)
          ) {
            // Check DP 113: firmware direct live cat weight in grams
            if (
              typeof dps["113"] === "number" &&
              dps["113"] > 500 &&
              dps["113"] < 25000
            ) {
              if (dps["113"] > state.peakWeight) {
                state.peakWeight = dps["113"];
                stateChanged = true;
              }
            }

            // Also check DP 112: scale weight delta
            if (dps["112"] && state.baseWeight > 0) {
              const currentWeight = dps["112"];
              const catWeight = currentWeight - state.baseWeight;
              if (catWeight > state.peakWeight && catWeight < 25000) {
                state.peakWeight = catWeight;
                stateChanged = true;
              }
            }
          }

          if (stateChanged) {
            deviceStates.set(config.id, state);
            // Let integrations (e.g. the MQTT bridge) push fresh state immediately.
            nitroApp.hooks.callHook("device:state-changed" as any, {
              deviceId: config.id,
            });
          }
        };

        currentDevice.on("data", handleData);
        currentDevice.on("dp-refresh", handleData);

        currentDevice.on("connected", () => {
          console.log(`[Tuya] Connected to device ${config.name}!`);

          // Immediately request state refresh to synchronize latest DPs
          try {
            currentDevice.get({ schema: true }).catch(() => {});
          } catch (e) {}

          if (!pingIntervals.has(config.id)) {
            const interval = setInterval(
              () => {
                try {
                  // Request a state refresh to ping the device
                  currentDevice.get({ schema: true }).catch(() => {});
                  console.log(
                    `[Tuya] Sent 5-min keepalive ping to ${config.name}`,
                  );
                } catch (e) {}
              },
              5 * 60 * 1000,
            ); // 5 minutes
            pingIntervals.set(config.id, interval);
          }
        });

        currentDevice
          .find()
          .then(() => {
            console.log(`[Tuya] Found device ${config.name}! Connecting...`);
            currentDevice.connect().catch((e: any) => {
              console.error(
                `[Tuya] Daemon failed to connect ${config.name}:`,
                e,
              );
            });
          })
          .catch((e: any) => {
            console.error(
              `[Tuya] Daemon failed to find device ${config.name}:`,
              e,
            );
            if (!retryTimeouts.has(config.id)) {
              const timeout = setTimeout(() => {
                retryTimeouts.delete(config.id);
                startTuyaListener();
              }, 10000);
              retryTimeouts.set(config.id, timeout);
            }
          });
      }
    } catch (error) {
      console.error("[Tuya] Daemon failed to fetch devices", error);
    }
  };

  nitroApp.hooks.hook("tuya:restart" as any, () => {
    console.log("[Tuya] Restarting daemon due to config change...");
    startTuyaListener();
  });

  nitroApp.hooks.hook(
    "tuya:action" as any,
    async ({ deviceId, action }: any) => {
      const device = activeDevices.get(deviceId);
      if (!device) {
        console.error(
          `[Tuya Action] Cannot send action, device ${deviceId} not connected.`,
        );
        return;
      }

      appTriggeredActions.set(deviceId, Date.now());

      try {
        const state = deviceStates.get(deviceId);
        if (!state || state.currentStatus === "unknown") {
          console.warn(
            `[Tuya Action] Refusing action '${action}' for ${deviceId}: device status is uninitialized/unknown. Awaiting first DP 116 reading.`,
          );
          return;
        }

        const inSettleWindow =
          state.lastVisitEndedAt &&
          Date.now() - state.lastVisitEndedAt < 15000;

        if (action === "flatten") {
          if (state && BUSY_STATUSES.has(state.currentStatus)) {
            console.warn(
              `[Tuya Action] Refusing flatten command for ${deviceId}: box is busy (${state.currentStatus})`,
            );
            return;
          }
          console.log(
            `[Tuya Action] Sending flatten command (DP 106) to ${deviceId}...`,
          );
          await device.set({ dps: 106, set: "AQEAAQA=" });
          await recordEvent({
            data: { type: "flatten-app", deviceId },
          });
          if (state) {
            state.currentStatus = "work_smooth"; // Prevent duplicate if hardware does echo it later
            state.lastFlattenTime = Date.now();
          }
        } else if (action === "clean") {
          if (
            state &&
            (BUSY_STATUSES.has(state.currentStatus) || inSettleWindow)
          ) {
            console.warn(
              `[Tuya Action] Refusing clean command for ${deviceId}: box is busy, cat present, or settle window active (${state.currentStatus})`,
            );
            return;
          }

          console.log(
            `[Tuya Action] Sending clean command (DP 106) to ${deviceId}...`,
          );
          await device.set({ dps: 106, set: "AQAAAA==" });
          await recordEvent({
            data: { type: "manual-clean-app", deviceId },
          });
          const stateAfter = deviceStates.get(deviceId);
          if (stateAfter) {
            stateAfter.currentStatus = "work_mclean";
            stateAfter.lastCleanTime = Date.now();
          }
        } else if (action === "tare") {
          if (
            state &&
            (BUSY_STATUSES.has(state.currentStatus) || inSettleWindow)
          ) {
            console.warn(
              `[Tuya Action] Refusing tare command for ${deviceId}: box is busy or cat present (${state.currentStatus})`,
            );
            return;
          }

          console.log(
            `[Tuya Action] Sending tare/zero command (DP 109) to ${deviceId}...`,
          );
          await device.set({ dps: 109, set: "AQEAAA==" });
        } else if (action === "cancel_clean") {
          console.log(
            `[Tuya Action] Sending cancel clean command (DP 106) to ${deviceId}...`,
          );
          await device.set({ dps: 106, set: "AQMAAA==" });
        } else if (action === "empty") {
          if (state && BUSY_STATUSES.has(state.currentStatus)) {
            console.warn(
              `[Tuya Action] Refusing empty command for ${deviceId}: box is busy (${state.currentStatus})`,
            );
            return;
          }
          console.log(
            `[Tuya Action] Sending empty command (DP 106) to ${deviceId}...`,
          );
          await device.set({ dps: 106, set: "AQIAAQA=" });
          await recordEvent({
            data: { type: "empty-app", deviceId },
          });
          if (state) {
            state.currentStatus = "work_empty"; // Prevent duplicate
            state.lastEmptyTime = Date.now();
          }
        }
      } catch (e) {
        console.error(
          `[Tuya Action] Failed to send action ${action} to ${deviceId}`,
          e,
        );
      }
    },
  );

  setTimeout(() => startTuyaListener(), 1000);
});
