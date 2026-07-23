import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({ data: { name: 'User', email: 'hello@example.com', weightUnit: 'kg' } })
    }
    return { user }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    
    if (body.user) {
      // Destructure to prevent mass assignment vulnerabilities
      const {
        name, email, weightUnit, webhookUrl, timezone,
        notifyPushVisit, notifyPushAutoClean, notifyPushManualClean, notifyPushEmpty, notifyPushFlatten, notifyPushError,
        notifyDashVisit, notifyDashAutoClean, notifyDashManualClean, notifyDashEmpty, notifyDashFlatten, notifyDashError,
        mqttEnabled, mqttHost, mqttPort, mqttUsername, mqttPassword, mqttBaseTopic
      } = body.user

      // Coerce port to an Int (or null). Leave undefined so unchanged fields are skipped.
      let mqttPortValue: number | null | undefined = mqttPort
      if (mqttPort !== undefined) {
        mqttPortValue = mqttPort === null || mqttPort === '' ? null : Number(mqttPort)
      }

      const safeData = {
        name, email, weightUnit, webhookUrl, timezone,
        notifyPushVisit, notifyPushAutoClean, notifyPushManualClean, notifyPushEmpty, notifyPushFlatten, notifyPushError,
        notifyDashVisit, notifyDashAutoClean, notifyDashManualClean, notifyDashEmpty, notifyDashFlatten, notifyDashError,
        mqttEnabled, mqttHost, mqttPort: mqttPortValue, mqttUsername, mqttPassword, mqttBaseTopic
      }

      const user = await prisma.user.findFirst()
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: safeData })
      } else {
        await prisma.user.create({ data: safeData })
      }

      // Reconnect the MQTT bridge only when MQTT settings actually changed, so
      // unrelated saves (timezone, notifications, ...) don't blip Home Assistant.
      const mqttKeys = ['mqttEnabled', 'mqttHost', 'mqttPort', 'mqttUsername', 'mqttPassword', 'mqttBaseTopic']
      if (mqttKeys.some((k) => k in body.user)) {
        const nitro = useNitroApp()
        await nitro.hooks.callHook('mqtt:restart' as any)
      }
    }
    return { success: true }
  }
})
