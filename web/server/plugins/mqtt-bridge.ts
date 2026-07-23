import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'
import prisma from '../utils/prisma'
import { computeDeviceState } from '../utils/deviceState'
import { computePetStates } from '../utils/petState'

// Bridges Pawbby Reborn to Home Assistant over MQTT using HA's discovery protocol.
// When enabled, entities (sensors, binary sensors, action buttons) appear in Home
// Assistant automatically under one "Pawbby" device per litter box — no YAML needed.
export default defineNitroPlugin((nitroApp) => {
  const DISCOVERY_PREFIX = 'homeassistant'
  const ALLOWED_ACTIONS = ['clean', 'flatten', 'empty']
  const ONLINE_WINDOW_MS = 15 * 60 * 1000

  let client: MqttClient | null = null
  let periodic: NodeJS.Timeout | null = null
  let baseTopic = 'pawbby'

  const availabilityTopic = () => `${baseTopic}/bridge/availability`
  const stateTopic = (id: string) => `${baseTopic}/${id}/state`
  const commandTopic = (id: string, action: string) => `${baseTopic}/${id}/command/${action}`
  const petStateTopic = (id: string) => `${baseTopic}/pet/${id}/state`

  const SENSORS = [
    { key: 'status', name: 'Status', tpl: '{{ value_json.status }}', icon: 'mdi:information-outline' },
    { key: 'waste_bin', name: 'Waste Bin', tpl: '{{ value_json.wasteBin }}', icon: 'mdi:delete' },
    { key: 'litter_level', name: 'Litter Level', tpl: '{{ value_json.litterLevel }}', icon: 'mdi:dots-grid' },
    { key: 'visits_today', name: 'Visits Today', tpl: '{{ value_json.todayToileted }}', unit: 'visits', state_class: 'total_increasing', icon: 'mdi:cat' },
    { key: 'last_weight', name: 'Last Visit Weight', tpl: '{{ value_json.latestWeight }}', unit: 'kg', device_class: 'weight', state_class: 'measurement' },
    { key: 'last_pet', name: 'Last Visit Pet', tpl: '{{ value_json.lastVisitPet }}', icon: 'mdi:paw' },
    { key: 'deodorizer_days', name: 'Deodorizer Days Left', tpl: '{{ value_json.deodorizerDaysLeft }}', unit: 'days', icon: 'mdi:air-filter' },
  ] as const

  const BINARY = [
    { key: 'online', name: 'Online', tpl: "{{ 'on' if value_json.online else 'off' }}", device_class: 'connectivity' },
    { key: 'lid_open', name: 'Lid Open', tpl: "{{ 'on' if value_json.lidOpen else 'off' }}", device_class: 'opening' },
    { key: 'bin_full', name: 'Waste Bin Full', tpl: "{{ 'on' if value_json.wasteBin == 'Full' else 'off' }}", device_class: 'problem' },
    { key: 'bin_removed', name: 'Bin Removed', tpl: "{{ 'on' if value_json.binRemoved else 'off' }}", device_class: 'problem' },
  ] as const

  // Only actions the daemon can actually perform are exposed as buttons. "clean" is
  // intentionally omitted — its Tuya payload is not yet known (no-op in tuya-listener).
  const BUTTONS = [
    { key: 'flatten', name: 'Flatten', action: 'flatten', icon: 'mdi:road-variant' },
    { key: 'empty', name: 'Empty', action: 'empty', icon: 'mdi:delete-empty' },
  ] as const

  // Per-cat sensors — each cat becomes its own Home Assistant device. Only raw
  // datapoints are published; state_class:measurement lets HA keep long-term
  // statistics so you can build weight/duration trends natively.
  const PET_SENSORS = [
    { key: 'last_used', name: 'Last Used', tpl: '{{ value_json.lastUsedAt }}', device_class: 'timestamp' },
    { key: 'weight', name: 'Weight', tpl: '{{ value_json.latestWeight }}', unit: 'kg', device_class: 'weight', state_class: 'measurement' },
    { key: 'last_duration', name: 'Last Duration', tpl: '{{ value_json.lastDuration }}', unit: 's', device_class: 'duration', state_class: 'measurement' },
    { key: 'visits_today', name: 'Visits Today', tpl: '{{ value_json.visitsToday }}', unit: 'visits', state_class: 'total_increasing', icon: 'mdi:paw' },
  ] as const

  const petDeviceBlock = (pet: { id: string; name: string }) => ({
    identifiers: [`pawbby_pet_${pet.id}`],
    name: pet.name,
    manufacturer: 'Pawbby Reborn',
    model: 'Cat',
  })

  const deviceBlock = (device: any) => ({
    identifiers: [`pawbby_${device.id}`],
    name: device.name || 'Pawbby Litter Box',
    manufacturer: 'Pawbby Reborn',
    model: 'Smart Litter Box',
  })

  const shapeState = (device: any, state: Awaited<ReturnType<typeof computeDeviceState>>) => {
    const online = !!state.lastHeartbeat && Date.now() - new Date(state.lastHeartbeat).getTime() < ONLINE_WINDOW_MS
    return {
      online,
      status: state.status,
      wasteBin: state.wasteBin,
      litterLevel: state.litterLevel,
      lidOpen: state.lidOpen,
      binRemoved: state.binRemoved,
      todayToileted: state.todayToileted,
      latestWeight: state.latestWeight,
      lastVisitPet: state.lastVisitPet,
      lastVisitAt: state.lastVisitAt,
      deodorizerActive: state.deodorizerActive,
      deodorizerDaysLeft: state.deodorizerDaysLeft,
      lastHeartbeat: state.lastHeartbeat,
    }
  }

  const availabilityFields = {
    availability_topic: '', // filled per publish (baseTopic may change)
    payload_available: 'online',
    payload_not_available: 'offline',
  }

  const publishDiscovery = async () => {
    if (!client) return
    const devices = await prisma.device.findMany()
    for (const device of devices) {
      const dev = deviceBlock(device)
      const avail = { ...availabilityFields, availability_topic: availabilityTopic() }

      for (const s of SENSORS) {
        const cfg: any = {
          name: s.name,
          unique_id: `pawbby_${device.id}_${s.key}`,
          object_id: `pawbby_${device.name}_${s.key}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          state_topic: stateTopic(device.id),
          value_template: s.tpl,
          device: dev,
          ...avail,
        }
        if ('unit' in s && s.unit) cfg.unit_of_measurement = s.unit
        if ('device_class' in s && s.device_class) cfg.device_class = s.device_class
        if ('state_class' in s && s.state_class) cfg.state_class = s.state_class
        if ('icon' in s && s.icon) cfg.icon = s.icon
        client.publish(
          `${DISCOVERY_PREFIX}/sensor/pawbby_${device.id}/${s.key}/config`,
          JSON.stringify(cfg),
          { retain: true },
        )
      }

      for (const b of BINARY) {
        const cfg: any = {
          name: b.name,
          unique_id: `pawbby_${device.id}_${b.key}`,
          object_id: `pawbby_${device.name}_${b.key}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          state_topic: stateTopic(device.id),
          value_template: b.tpl,
          payload_on: 'on',
          payload_off: 'off',
          device_class: b.device_class,
          device: dev,
          ...avail,
        }
        client.publish(
          `${DISCOVERY_PREFIX}/binary_sensor/pawbby_${device.id}/${b.key}/config`,
          JSON.stringify(cfg),
          { retain: true },
        )
      }

      for (const btn of BUTTONS) {
        const cfg: any = {
          name: btn.name,
          unique_id: `pawbby_${device.id}_btn_${btn.key}`,
          object_id: `pawbby_${device.name}_${btn.key}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          command_topic: commandTopic(device.id, btn.action),
          payload_press: 'PRESS',
          icon: btn.icon,
          device: dev,
          ...avail,
        }
        client.publish(
          `${DISCOVERY_PREFIX}/button/pawbby_${device.id}/${btn.key}/config`,
          JSON.stringify(cfg),
          { retain: true },
        )
      }
    }
  }

  const publishState = async (deviceId?: string) => {
    if (!client) return
    const devices = deviceId
      ? await prisma.device.findMany({ where: { id: deviceId } })
      : await prisma.device.findMany()
    for (const device of devices) {
      const state = await computeDeviceState(device)
      client.publish(stateTopic(device.id), JSON.stringify(shapeState(device, state)), { retain: true })
    }
  }

  const publishPetDiscovery = async () => {
    if (!client) return
    const pets = await prisma.pet.findMany()
    const avail = { ...availabilityFields, availability_topic: availabilityTopic() }
    for (const pet of pets) {
      const dev = petDeviceBlock(pet)
      for (const s of PET_SENSORS) {
        const cfg: any = {
          name: s.name,
          unique_id: `pawbby_pet_${pet.id}_${s.key}`,
          object_id: `pawbby_${pet.name}_${s.key}`.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          state_topic: petStateTopic(pet.id),
          value_template: s.tpl,
          device: dev,
          ...avail,
        }
        if ('unit' in s && s.unit) cfg.unit_of_measurement = s.unit
        if ('device_class' in s && s.device_class) cfg.device_class = s.device_class
        if ('state_class' in s && s.state_class) cfg.state_class = s.state_class
        if ('icon' in s && s.icon) cfg.icon = s.icon
        client.publish(
          `${DISCOVERY_PREFIX}/sensor/pawbby_pet_${pet.id}/${s.key}/config`,
          JSON.stringify(cfg),
          { retain: true },
        )
      }
    }
  }

  const publishPetState = async () => {
    if (!client) return
    const pets = await computePetStates()
    for (const pet of pets) {
      // A timestamp sensor rejects null; publish empty so HA shows "unknown" instead.
      const payload = {
        name: pet.name,
        lastUsedAt: pet.lastUsedAt ?? '',
        latestWeight: pet.latestWeight,
        lastDuration: pet.lastDuration,
        visitsToday: pet.visitsToday,
      }
      client.publish(petStateTopic(pet.id), JSON.stringify(payload), { retain: true })
    }
  }

  const handleCommand = async (topic: string, payload: Buffer) => {
    // Expected: <baseTopic>/<deviceId>/command/<action>
    const prefix = `${baseTopic}/`
    if (!topic.startsWith(prefix)) return
    const parts = topic.slice(prefix.length).split('/')
    if (parts.length !== 3 || parts[1] !== 'command') return
    const [deviceId, , action] = parts
    if (!ALLOWED_ACTIONS.includes(action)) {
      console.warn(`[MQTT] Ignoring unknown action '${action}'`)
      return
    }
    console.log(`[MQTT] Command received: ${action} -> device ${deviceId}`)
    try {
      await nitroApp.hooks.callHook('tuya:action' as any, { deviceId, action })
    } catch (e: any) {
      console.error('[MQTT] Failed to dispatch action:', e?.message)
    }
  }

  const stop = () => {
    if (periodic) {
      clearInterval(periodic)
      periodic = null
    }
    if (client) {
      try {
        client.end(true)
      } catch (e) {}
      client = null
    }
  }

  const start = async () => {
    stop()

    const user = await prisma.user.findFirst()
    if (!user?.mqttEnabled || !user.mqttHost) return

    baseTopic = user.mqttBaseTopic || 'pawbby'
    const port = user.mqttPort || 1883
    const url = `mqtt://${user.mqttHost}:${port}`

    console.log(`[MQTT] Connecting to broker ${url} ...`)

    client = mqtt.connect(url, {
      username: user.mqttUsername || undefined,
      password: user.mqttPassword || undefined,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      will: {
        topic: availabilityTopic(),
        payload: 'offline',
        retain: true,
        qos: 0,
      },
    })

    client.on('connect', async () => {
      console.log('[MQTT] Connected to broker.')
      client!.publish(availabilityTopic(), 'online', { retain: true })
      client!.subscribe(`${baseTopic}/+/command/+`)
      try {
        await publishDiscovery()
        await publishPetDiscovery()
        await publishState()
        await publishPetState()
      } catch (e: any) {
        console.error('[MQTT] Initial publish failed:', e?.message)
      }
      if (!periodic) {
        periodic = setInterval(() => {
          publishState().catch((e) => console.error('[MQTT] Periodic publish failed:', e?.message))
          publishPetState().catch((e) => console.error('[MQTT] Periodic pet publish failed:', e?.message))
        }, 30000)
      }
    })

    client.on('message', (topic, payload) => {
      handleCommand(topic, payload).catch((e) => console.error('[MQTT] Command handler error:', e?.message))
    })

    client.on('error', (err) => {
      console.error('[MQTT] Client error:', err.message)
    })
  }

  // Reconnect / disconnect when the user changes MQTT settings.
  nitroApp.hooks.hook('mqtt:restart' as any, () => {
    console.log('[MQTT] Restarting bridge due to config change...')
    start()
  })

  // Re-publish discovery + state without reconnecting (e.g. a cat or device was
  // added/removed) so new entities appear in Home Assistant promptly.
  nitroApp.hooks.hook('mqtt:refresh' as any, async () => {
    if (!client?.connected) return
    try {
      await publishDiscovery()
      await publishPetDiscovery()
      await publishState()
      await publishPetState()
    } catch (e: any) {
      console.error('[MQTT] Refresh failed:', e?.message)
    }
  })

  // Push fresh state the moment the Tuya listener sees a change (a visit also
  // updates the relevant cat's last-used / weight / visit count).
  nitroApp.hooks.hook('device:state-changed' as any, ({ deviceId }: any) => {
    publishState(deviceId).catch((e) => console.error('[MQTT] State push failed:', e?.message))
    publishPetState().catch((e) => console.error('[MQTT] Pet state push failed:', e?.message))
  })

  // Start slightly after the Tuya listener so devices are known.
  setTimeout(() => start().catch((e) => console.error('[MQTT] Startup failed:', e?.message)), 2000)
})
