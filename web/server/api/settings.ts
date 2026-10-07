import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const user = await prisma.user.findUnique({ where: { id: event.context.userId } })
    return { user }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    
    if (body.user) {
      const sensitiveKeys = ['webhookUrl', 'enableAutomatedBackups', 'mqttEnabled', 'mqttHost', 'mqttPort', 'mqttUsername', 'mqttPassword', 'mqttBaseTopic', 'apiKey']
      if (event.context.userRole !== 'ADMIN' && sensitiveKeys.some((k) => k in body.user)) {
        throw createError({ statusCode: 403, statusMessage: 'Only administrators can modify system settings.' })
      }
      // Destructure to prevent mass assignment vulnerabilities
      const {
        name, email, weightUnit, webhookUrl, timezone, enableAutomatedBackups,
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
        name, email, weightUnit, webhookUrl, timezone, enableAutomatedBackups,
        notifyPushVisit, notifyPushAutoClean, notifyPushManualClean, notifyPushEmpty, notifyPushFlatten, notifyPushError,
        notifyDashVisit, notifyDashAutoClean, notifyDashManualClean, notifyDashEmpty, notifyDashFlatten, notifyDashError,
        mqttEnabled, mqttHost, mqttPort: mqttPortValue, mqttUsername, mqttPassword, mqttBaseTopic
      }

      await prisma.user.update({ where: { id: event.context.userId }, data: safeData })

      // Reconnect the MQTT bridge only when MQTT settings actually changed, so
      // unrelated saves (timezone, notifications, ...) don't blip Home Assistant.
      const mqttKeys = ['mqttEnabled', 'mqttHost', 'mqttPort', 'mqttUsername', 'mqttPassword', 'mqttBaseTopic']
      if (mqttKeys.some((k) => k in body.user)) {
        const nitro = useNitroApp()
        await nitro.hooks.callHook('mqtt:restart' as any)
      }

      // The litter box mirrors the account's weight unit and time zone (DP 105);
      // push them to every connected device when they change.
      if ('weightUnit' in body.user || 'timezone' in body.user) {
        const nitro = useNitroApp()
        nitro.hooks
          .callHook('tuya:sync-account' as any, {
            weightUnit: 'weightUnit' in body.user,
            timezone: 'timezone' in body.user,
          })
          .catch((e: any) => console.error('[Settings] Device account sync failed:', e?.message))
      }
    }
    return { success: true }
  }
})