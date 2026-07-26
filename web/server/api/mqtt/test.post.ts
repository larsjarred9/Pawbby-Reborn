import mqtt from 'mqtt'

// Attempts a short-lived connection to the configured broker so the user can verify
// their settings from the dashboard. Session-authed (not under /api/external).
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { mqttHost, mqttPort, mqttUsername, mqttPassword } = body || {}

  if (!mqttHost) {
    throw createError({ statusCode: 400, statusMessage: 'MQTT host is required' })
  }

  const port = Number(mqttPort) || 1883
  const url = `mqtt://${mqttHost}:${port}`

  return await new Promise((resolve, reject) => {
    let settled = false
    const client = mqtt.connect(url, {
      username: mqttUsername || undefined,
      password: mqttPassword || undefined,
      connectTimeout: 5000,
      reconnectPeriod: 0, // don't retry — this is a one-shot test
    })

    const finish = (errMsg?: string) => {
      if (settled) return
      settled = true
      try {
        client.end(true)
      } catch (e) {}
      if (errMsg) {
        reject(createError({ statusCode: 500, statusMessage: errMsg }))
      } else {
        resolve({ success: true })
      }
    }

    client.on('connect', () => finish())
    client.on('error', (e) => finish(e.message || 'Connection failed'))
    setTimeout(() => finish('Connection timed out'), 6000)
  })
})
