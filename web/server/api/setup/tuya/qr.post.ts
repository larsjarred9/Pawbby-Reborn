import { mintTuyaQrToken } from '../../../utils/tuyaSharing'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userCode = body?.userCode

  if (!userCode || typeof userCode !== 'string' || !userCode.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please provide a valid Smart Life User Code.'
    })
  }

  const result = await mintTuyaQrToken(userCode.trim())
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error || 'Failed to generate QR code from Tuya'
    })
  }

  return {
    success: true,
    token: result.token,
    qrSvg: result.qrSvg,
    qrContent: result.qrContent
  }
})

