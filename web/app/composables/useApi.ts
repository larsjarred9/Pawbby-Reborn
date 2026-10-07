import SparkMD5 from 'spark-md5'

// Types
export interface User {
  id?: string
  name: string
  email: string
  avatarUrl?: string
  weightUnit?: 'kg' | 'lb'
  webhookUrl?: string
  timezone?: string
  role?: string
  apiKey?: string
  mqttEnabled?: boolean
  mqttHost?: string
  mqttPort?: number
  mqttUsername?: string
  mqttPassword?: string
  mqttBaseTopic?: string
}

export interface Pet {
  id?: string
  name: string
  birthDate?: string // YYYY-MM-DD
  weight: number
  imageBase64?: string
}

export interface DeviceSettings {
  autoClean: boolean
  softClumps: boolean
  sleepEnabled: boolean
  sleepStart: string // "HH:MM" device local time
  sleepStop: string
  autoOffScreen: boolean
  childLock: boolean
  autoCleanDelayMin: number
  litterType: number
  weightUnit: 'kg' | 'lb'
  litterLevelRaw: number
  deodorantDays: number
  binFull: boolean
  binRemoved: boolean
  lidOpen: boolean
  catIn: boolean
  catNear: boolean
  catInLongTime: boolean
  raw: string
}

export interface LitterCard {
  id: number
  name: string
  simpleLabel: string
  badge: string
  badgeClass: string
  image: string
}

export const LITTER_CARDS: LitterCard[] = [
  {
    id: 0,
    name: 'Pawbby Natural',
    simpleLabel: 'Plant-based starch pellets',
    badge: 'Recommended',
    badgeClass: 'bg-emerald-500/80 text-white',
    image: '/litter_natural.jpg',
  },
  {
    id: 1,
    name: 'Tofu Litter',
    simpleLabel: 'Flushable cylindrical rods',
    badge: 'Tofu Pellets',
    badgeClass: 'bg-amber-500/80 text-white',
    image: '/litter_tofu.jpg',
  },
  {
    id: 2,
    name: 'Bentonite Clay',
    simpleLabel: 'Classic clumping sand',
    badge: 'Clay Sand',
    badgeClass: 'bg-sky-500/80 text-white',
    image: '/litter_bentonite.jpg',
  },
  {
    id: 3,
    name: 'Mixed Blend',
    simpleLabel: 'Tofu rods + clay granules',
    badge: 'Composite Mix',
    badgeClass: 'bg-purple-500/80 text-white',
    image: '/litter_mixed.jpg',
  },
]

/** Litter types known by the firmware (index = value stored on the box). Keep in sync with server/utils/deviceSettings.ts */
export const LITTER_TYPES = [
  { id: 0, name: 'Pawbby Natural Cat Litter', hint: 'Plant-based (recommended by the vendor)' },
  { id: 1, name: 'Tofu cat litter', hint: '' },
  { id: 2, name: 'Bentonite cat litter', hint: 'Clay' },
  { id: 3, name: 'Mixed cat litter', hint: 'Tofu + bentonite blend' },
] as const

export type DeviceSettingKey =
  | 'auto_clean' | 'soft_clumps' | 'sleep_mode' | 'auto_off_screen' | 'child_lock'
  | 'auto_clean_delay' | 'sleep_window' | 'litter_type' | 'reset_deodorant' | 'refresh'

export interface Device {
  id: string
  name: string
  mode: string
  deviceId: string
  ipAddress?: string
  localKey?: string
  tuyaClientId?: string
  tuyaClientSecret?: string
  tuyaRegion?: string
  deodorizerLastReset?: string
  deodorizerDuration?: number
  lastHeartbeat?: string
  status: 'Ready' | 'Cleaning' | 'Flattening' | 'Emptying' | 'Error'
  lastToileted: string
  todayToileted: number
  litterLevel: string
  wasteBin: string
  daysLeft: number
  lidOpen?: boolean
  binRemoved?: boolean
  settings?: DeviceSettings | null
  settingsUpdatedAt?: string | null
}

export interface DeviceLog {
  id: string
  deviceId: string
  petId?: string
  type: 'toileted' | 'manual-clean' | 'auto-clean' | 'flatten' | 'empty' | 'error' | 'tuya-raw-data' | 'reset-deodorizer'
  rawTimestamp?: string
  localDate?: string
  timestamp: string
  description: string
}

function getGravatar(email: string) {
  if (!email) return ''
  const hash = SparkMD5.hash(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`
}

export const useApi = () => {

  const getUser = async (): Promise<User> => {
    const { user } = await $fetch('/api/settings') as any
    if (user && !user.avatarUrl && user.email) {
      user.avatarUrl = getGravatar(user.email)
    }
    return user
  }

  const generateApiKey = async (): Promise<string> => {
    const { apiKey } = await $fetch('/api/auth/api-key', { method: 'POST' }) as any
    return apiKey
  }

  const updateUser = async (updates: Partial<User>) => {
    const user = { ...updates }
    if (updates.email) user.avatarUrl = getGravatar(updates.email)
    await $fetch('/api/settings', { method: 'POST', body: { user } })
    return user
  }

  const getUsers = async (): Promise<User[]> => {
    const users = await $fetch('/api/users') as User[]
    return users.map(u => {
      if (!u.avatarUrl && u.email) u.avatarUrl = getGravatar(u.email)
      return u
    })
  }

  const deleteUser = async (id: string) => {
    await $fetch(`/api/users?id=${id}`, { method: 'DELETE' })
  }

  const addUser = async (userData: any) => {
    return await $fetch('/api/users', { method: 'POST', body: userData })
  }

  const getPets = async (): Promise<Pet[]> => {
    return await $fetch('/api/pets') as Pet[]
  }

  const addPet = async (pet: Omit<Pet, 'id'>) => {
    return await $fetch('/api/pets', { method: 'POST', body: pet })
  }

  const updatePet = async (id: string, updates: Partial<Pet>) => {
    return await $fetch('/api/pets', { method: 'POST', body: { id, ...updates } })
  }

  const deletePet = async (id: string) => {
    await $fetch('/api/pets', { method: 'DELETE', query: { id } })
  }

  const clearCache = async () => {
    // Only reload the page now, database manages state
  }

  const getDevices = async (): Promise<Device[]> => {
    const { devices } = await $fetch('/api/devices') as any
    return devices
  }

  const createDevice = async (deviceData: any) => {
    const { device } = await $fetch('/api/devices', { method: 'POST', body: deviceData }) as any
    return device
  }

  const updateDevice = async (id: string, deviceData: any) => {
    const { device } = await $fetch('/api/devices', { method: 'PUT', body: { id, ...deviceData } }) as any
    return device
  }

  const deleteDevice = async (id: string) => {
    await $fetch(`/api/devices?id=${id}`, { method: 'DELETE' })
  }

  const getDevice = async (id: string) => {}
  const getLogs = async (deviceId: string): Promise<DeviceLog[]> => {
    const { events } = await $fetch(`/api/events?deviceId=${deviceId}`) as any
    return events
  }

  const createEvent = async (data: any) => {
    const { event } = await $fetch('/api/events', { method: 'POST', body: data }) as any
    return event
  }
  const assignPetToEvent = async (id: string, petId: string | null) => {
    const { event } = await $fetch('/api/events', { method: 'PUT', body: { id, petId } }) as any
    return event
  }
  const triggerClean = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'clean' } })
  }
  const triggerFlatten = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'flatten' } })
  }
  const triggerEmpty = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'empty' } })
  }
  const triggerTare = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'tare' } })
  }
  const triggerCancelClean = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'cancel_clean' } })
  }
  /** Change a hardware setting on the box (DP 105). See server/utils/deviceSettings.ts for keys/values. */
  const updateDeviceSetting = async (deviceId: string, setting: DeviceSettingKey, value?: any) => {
    return await $fetch('/api/device-settings', { method: 'POST', body: { deviceId, setting, value } }) as any
  }

  const resizeImage = (file: File, maxWidth = 400, maxHeight = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * maxWidth / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * maxHeight / height)
              height = maxHeight
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = (e) => reject(e)
      }
      reader.onerror = (e) => reject(e)
    })
  }

  return {
    getUser,
    getUsers,
    deleteUser,
    addUser,
    generateApiKey,
    updateUser,
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    getDevice,
    getLogs,
    createEvent,
    assignPetToEvent,
    triggerClean,
    triggerFlatten,
    triggerEmpty,
    triggerTare,
    triggerCancelClean,
    updateDeviceSetting,
    getPets,
    addPet,
    updatePet,
    deletePet,
    resizeImage,
    clearCache
  }
}
