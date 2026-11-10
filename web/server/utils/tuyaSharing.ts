import crypto from 'crypto'
import { renderSVG } from 'uqr'

export const TUYA_CLIENT_ID = 'HA_3y9q4ak7g4ephrvke'
export const TUYA_SCHEMA = 'haauthorize'
export const TUYA_AUTH_HOST = 'apigw.iotbing.com'

export interface TuyaTokenInfo {
  t?: number
  uid?: string
  expire_time?: number
  access_token: string
  refresh_token: string
}

export interface TuyaSession {
  clientId: string
  userCode: string
  terminalId?: string
  endpoint: string
  tokenInfo: TuyaTokenInfo
}

export interface DiscoveredTuyaDevice {
  id: string
  name: string
  localKey: string
  ip: string
  category?: string
  productId?: string
  productName?: string
  online?: boolean
  isPawbby: boolean
}

/**
 * Mint a QR login token from Tuya's device sharing gateway.
 */
export async function mintTuyaQrToken(userCode: string): Promise<{
  success: boolean
  token?: string
  qrContent?: string
  qrSvg?: string
  error?: string
}> {
  try {
    const url = `https://${TUYA_AUTH_HOST}/v1.0/m/life/home-assistant/qrcode/tokens?clientid=${TUYA_CLIENT_ID}&usercode=${encodeURIComponent(userCode.trim())}&schema=${TUYA_SCHEMA}`
    const res = await fetch(url, { method: 'POST' })
    const data = await res.json() as any

    if (!data.success || !data.result?.qrcode) {
      return {
        success: false,
        error: data.msg || 'Failed to generate QR code. Please verify your user code in the Smart Life app.'
      }
    }

    const token = data.result.qrcode
    const qrContent = `smartlife--qrLogin?token=${token}`
    const qrSvg = renderSVG(qrContent)

    return {
      success: true,
      token,
      qrContent,
      qrSvg
    }
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || 'Network error reaching Tuya auth service'
    }
  }
}

/**
 * Poll whether the user has confirmed the QR login in their app.
 */
export async function pollTuyaQrLogin(
  token: string,
  userCode: string
): Promise<{
  success: boolean
  confirmed: boolean
  session?: TuyaSession
  error?: string
}> {
  try {
    const url = `https://${TUYA_AUTH_HOST}/v1.0/m/life/home-assistant/qrcode/tokens/${encodeURIComponent(token)}?clientid=${TUYA_CLIENT_ID}&usercode=${encodeURIComponent(userCode.trim())}`
    const res = await fetch(url, { method: 'GET' })
    const data = await res.json() as any

    if (data.success && data.result?.access_token) {
      const resData = data.result
      const endpoint = resData.endpoint || resData.end_point || 'https://openapi.tuyaeu.com'
      
      const session: TuyaSession = {
        clientId: TUYA_CLIENT_ID,
        userCode: userCode.trim(),
        terminalId: resData.terminal_id,
        endpoint: endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint,
        tokenInfo: {
          t: data.t,
          uid: resData.uid,
          expire_time: resData.expire_time,
          access_token: resData.access_token,
          refresh_token: resData.refresh_token
        }
      }

      return {
        success: true,
        confirmed: true,
        session
      }
    }

    return {
      success: true,
      confirmed: false,
      error: data.msg
    }
  } catch (e: any) {
    return {
      success: false,
      confirmed: false,
      error: e?.message || 'Error checking QR confirmation status'
    }
  }
}

/* ------------------------------------------------------------------ */
/* Authenticated Tuya Customer API Cryptography & Device Fetching     */
/* ------------------------------------------------------------------ */

function secretGenerating(rid: string, sid: string, hashKey: string): string {
  let message = hashKey
  const mod = 16
  if (sid !== '') {
    const len = sid.length < mod ? sid.length : mod
    let ecode = ''
    for (let i = 0; i < len; i++) {
      const idx = sid.charCodeAt(i) % mod
      ecode += sid[idx]
    }
    message += '_' + ecode
  }
  const checksum = crypto.createHmac('sha256', Buffer.from(rid, 'utf-8')).update(Buffer.from(message, 'utf-8')).digest('hex')
  return checksum.slice(0, 16)
}

function aesGcmEncrypt(rawStr: string, secret: string): string {
  const nonceChars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  let nonceStr = ''
  for (let i = 0; i < 12; i++) {
    nonceStr += nonceChars[crypto.randomInt(0, nonceChars.length)]
  }
  const nonce = Buffer.from(nonceStr, 'utf-8')
  const cipher = crypto.createCipheriv('aes-128-gcm', Buffer.from(secret, 'utf-8'), nonce)
  const enc = Buffer.concat([cipher.update(rawStr, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([nonce, enc, tag]).toString('base64')
}

function aesGcmDecrypt(b64: string, secret: string): string {
  const buf = Buffer.from(b64, 'base64')
  const nonce = buf.subarray(0, 12)
  const tag = buf.subarray(buf.length - 16)
  const ct = buf.subarray(12, buf.length - 16)

  const decipher = crypto.createDecipheriv('aes-128-gcm', Buffer.from(secret, 'utf-8'), nonce)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(ct), decipher.final()])
  return dec.toString('utf-8')
}

function restfulSign(
  hashKey: string,
  queryEncdata: string,
  bodyEncdata: string,
  headers: Record<string, string>
): string {
  const headerKeys = ['X-appKey', 'X-requestId', 'X-sid', 'X-time', 'X-token']
  let headerSignStr = ''
  for (const k of headerKeys) {
    const val = headers[k] || ''
    if (val !== '') {
      headerSignStr += k + '=' + val + '||'
    }
  }
  let signStr = headerSignStr.slice(0, -2)
  if (queryEncdata) signStr += queryEncdata
  if (bodyEncdata) signStr += bodyEncdata

  return crypto.createHmac('sha256', Buffer.from(hashKey, 'utf-8')).update(Buffer.from(signStr, 'utf-8')).digest('hex')
}

async function tuyaCustomerRequest(
  session: TuyaSession,
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, any> | null = null,
  body: Record<string, any> | null = null
): Promise<any> {
  const rid = crypto.randomUUID()
  const sid = ''
  const ridRefreshToken = rid + session.tokenInfo.refresh_token
  const hashKey = crypto.createHash('md5').update(ridRefreshToken, 'utf-8').digest('hex')
  const secret = secretGenerating(rid, sid, hashKey)

  let queryEncdata = ''
  let queryString = ''
  if (params && Object.keys(params).length > 0) {
    const formJson = JSON.stringify(params)
    queryEncdata = aesGcmEncrypt(formJson, secret)
    queryString = `?encdata=${encodeURIComponent(queryEncdata)}`
  }

  let bodyEncdata = ''
  let requestBody: any = null
  if (body && Object.keys(body).length > 0) {
    const formJson = JSON.stringify(body)
    bodyEncdata = aesGcmEncrypt(formJson, secret)
    requestBody = JSON.stringify({ encdata: bodyEncdata })
  }

  const t = Date.now().toString()
  const headers: Record<string, string> = {
    'X-appKey': session.clientId,
    'X-requestId': rid,
    'X-sid': sid,
    'X-time': t,
    'X-token': session.tokenInfo.access_token,
    'Content-Type': 'application/json'
  }

  const sign = restfulSign(hashKey, queryEncdata, bodyEncdata, headers)
  headers['X-sign'] = sign

  const targetUrl = `${session.endpoint}${path}${queryString}`
  const response = await fetch(targetUrl, {
    method,
    headers,
    body: requestBody
  })

  if (!response.ok) {
    throw new Error(`Tuya API responded with HTTP ${response.status}`)
  }

  const resJson = await response.json() as any
  if (!resJson.success) {
    throw new Error(`Tuya API error: (${resJson.code}) ${resJson.msg}`)
  }

  if (resJson.result) {
    const decryptedStr = aesGcmDecrypt(resJson.result, secret)
    try {
      return JSON.parse(decryptedStr)
    } catch {
      return decryptedStr
    }
  }

  return null
}

/**
 * Fetch all devices across all homes for the authenticated Tuya session.
 */
export async function fetchTuyaDevices(session: TuyaSession): Promise<DiscoveredTuyaDevice[]> {
  // 1. Query homes
  const homes = await tuyaCustomerRequest(session, 'GET', '/v1.0/m/life/users/homes')
  if (!Array.isArray(homes)) {
    return []
  }

  const devices: DiscoveredTuyaDevice[] = []
  const seenIds = new Set<string>()

  // 2. Query devices for each home
  for (const home of homes) {
    const homeId = home.ownerId || home.id
    if (!homeId) continue

    try {
      const devList = await tuyaCustomerRequest(session, 'GET', '/v1.0/m/life/ha/home/devices', {
        homeId: String(homeId)
      })

      if (Array.isArray(devList)) {
        for (const dev of devList) {
          if (!dev.id || seenIds.has(dev.id)) continue
          seenIds.add(dev.id)

          const name = String(dev.name || dev.product_name || 'Tuya Device')
          const cat = String(dev.category || '').toLowerCase()
          const pName = String(dev.product_name || '').toLowerCase()
          const lowerName = name.toLowerCase()

          // Litter box identification: Pawbby, litter box, or category 'cwwsp' (pet care / litter box)
          const isPawbby =
            lowerName.includes('pawbby') ||
            lowerName.includes('litter') ||
            pName.includes('pawbby') ||
            pName.includes('litter') ||
            cat === 'cwwsp'

          devices.push({
            id: dev.id,
            name,
            localKey: dev.local_key || '',
            local_key: dev.local_key || '',
            ip: dev.ip || '',
            category: dev.category,
            productId: dev.product_id,
            productName: dev.product_name,
            online: dev.online ?? true,
            isPawbby
          })
        }
      }
    } catch (err: any) {
      console.warn(`Failed to fetch devices for home ${homeId}:`, err?.message || err)
    }
  }

  // Sort so Pawbby/litter boxes appear first
  devices.sort((a, b) => {
    if (a.isPawbby && !b.isPawbby) return -1
    if (!a.isPawbby && b.isPawbby) return 1
    return a.name.localeCompare(b.name)
  })

  return devices
}

