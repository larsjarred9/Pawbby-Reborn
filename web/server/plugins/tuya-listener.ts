import TuyaDevice from "tuyapi";
import prisma from "../utils/prisma";

export default defineNitroPlugin((nitroApp) => {
  interface DeviceState {
    baseWeight: number;
    currentStatus: string;
    catEnteredAt: number | null;
    peakWeight: number;
    pendingLitterCheck: boolean;
    lastFlattenTime: number;
    lastCleanTime: number;
    lastEmptyTime: number;
    lastCatLeaveTime: number;
  }

  const activeDevices = new Map<string, any>();
  const retryTimeouts = new Map<string, any>();
  const pingIntervals = new Map<string, any>();
  const deviceStates = new Map<string, DeviceState>();
  const appTriggeredActions = new Map<string, number>();

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
          deviceStates.set(config.id, {
            baseWeight: 0,
            currentStatus: "work_idle",
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

            // PawID Matching Logic
            const pets = await prisma.pet.findMany();
            let matchedPetId = null;
            let minDiff = 0.2; // 200g threshold for matching

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

            await prisma.litterEvent.create({
              data: {
                type: "toileted",
                deviceId: config.id,
                petId: matchedPetId,
                weight: weightInKg > 0 ? weightInKg : null,
                duration: durationSecs,
                rawData: JSON.stringify(dps["107"]),
              },
            });

            // Reset visit state
            state.catEnteredAt = null;
            state.peakWeight = 0;
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
                await prisma.litterEvent.create({
                  data: { type: "auto-clean", deviceId: config.id },
                });
                state.lastCleanTime = now;
              }
            }
            if (
              newStatus === "work_mclean" &&
              state.currentStatus !== "work_mclean"
            ) {
              if (now - state.lastCleanTime > 60000) {
                await prisma.litterEvent.create({
                  data: {
                    type: isApp ? "manual-clean-app" : "manual-clean",
                    deviceId: config.id,
                  },
                });
                state.lastCleanTime = now;
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

                await prisma.litterEvent.create({
                  data: {
                    type: flattenType,
                    deviceId: config.id,
                  },
                });
                state.lastFlattenTime = now;
              }
            }
            if (
              newStatus === "work_empty" &&
              state.currentStatus !== "work_empty"
            ) {
              if (now - state.lastEmptyTime > 60000) {
                await prisma.litterEvent.create({
                  data: {
                    type: isApp ? "empty-app" : "empty",
                    deviceId: config.id,
                  },
                });
                state.lastEmptyTime = now;
              }
            }
            if (
              newStatus === "lid_open" &&
              state.currentStatus !== "lid_open"
            ) {
              await prisma.litterEvent.create({
                data: { type: "lid-removed", deviceId: config.id },
              });
            }
            if (
              state.currentStatus === "lid_open" &&
              newStatus !== "lid_open"
            ) {
              await prisma.litterEvent.create({
                data: { type: "lid-replaced", deviceId: config.id },
              });
              state.pendingLitterCheck = true;
            }

            if (
              newStatus === "collect_install" &&
              state.currentStatus !== "collect_install"
            ) {
              await prisma.litterEvent.create({
                data: { type: "bin-removed", deviceId: config.id },
              });
            }
            if (
              state.currentStatus === "collect_install" &&
              newStatus !== "collect_install"
            ) {
              await prisma.litterEvent.create({
                data: { type: "bin-replaced", deviceId: config.id },
              });
            }

            // Quick visit detection: If it returns to idle but we were still tracking an unconfirmed visit
            if (
              newStatus === "work_idle" &&
              state.catEnteredAt &&
              state.peakWeight > 0
            ) {
              const durationSecs = Math.round(
                (Date.now() - state.catEnteredAt) / 1000,
              );
              const weightInKg = state.peakWeight / 1000;

              const pets = await prisma.pet.findMany();
              let matchedPetId = null;
              let minDiff = 0.2;
              for (const pet of pets) {
                const diff = Math.abs(pet.weight - weightInKg);
                if (diff <= minDiff) {
                  minDiff = diff;
                  matchedPetId = pet.id;
                }
              }

              console.log(
                `[PawID] Quick peek detected! Weight: ${weightInKg}kg, Duration: ${durationSecs}s.`,
              );

              await prisma.litterEvent.create({
                data: {
                  type: "quick-visit",
                  deviceId: config.id,
                  petId: matchedPetId,
                  weight: weightInKg,
                  duration: durationSecs,
                },
              });

              state.catEnteredAt = null;
              state.peakWeight = 0;
            }

            state.currentStatus = newStatus;
            stateChanged = true;
          }

          // 3. Track Base Weight during idle (DP 112)
          if (state.currentStatus === "work_idle" && dps["112"]) {
            if (state.pendingLitterCheck && state.baseWeight > 0) {
              const diff = dps["112"] - state.baseWeight;
              if (Math.abs(diff) >= 50) { // Only log if > 50g changed
                await prisma.litterEvent.create({
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

          // 4. Detect Cat Entry & Track Peak Weight
          if (state.currentStatus === "cat_enter") {
            if (!state.catEnteredAt) {
              state.catEnteredAt = Date.now();
              state.peakWeight = 0;
              stateChanged = true;
            }
            if (dps["112"]) {
              const currentWeight = dps["112"];
              const catWeight = currentWeight - state.baseWeight;
              if (catWeight > state.peakWeight) {
                state.peakWeight = catWeight;
                stateChanged = true;
              }
            }
          }

          if (stateChanged) {
            deviceStates.set(config.id, state);
          }
        };

        currentDevice.on("data", handleData);
        currentDevice.on("dp-refresh", handleData);

        currentDevice.on("connected", () => {
          console.log(`[Tuya] Connected to device ${config.name}!`);

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
        if (action === "flatten") {
          console.log(
            `[Tuya Action] Sending flatten command (DP 106) to ${deviceId}...`,
          );
          await device.set({ dps: 106, set: "AQEAAQA=" });
          await prisma.litterEvent.create({
            data: { type: "flatten-app", deviceId },
          });
          const state = deviceStates.get(deviceId);
          if (state) {
            state.currentStatus = "work_smooth"; // Prevent duplicate if hardware does echo it later
            state.lastFlattenTime = Date.now();
          }
        } else if (action === "clean") {
          // TODO: Need payload for clean
          console.log(`[Tuya Action] Clean command not implemented yet!`);
        } else if (action === "empty") {
          console.log(
            `[Tuya Action] Sending empty command (DP 106) to ${deviceId}...`,
          );
          await device.set({ dps: 106, set: "AQIAAQA=" });
          await prisma.litterEvent.create({
            data: { type: "empty-app", deviceId },
          });
          const state = deviceStates.get(deviceId);
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
