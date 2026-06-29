import SparkMD5 from 'spark-md5'

// Types
export interface User {
  id?: string
  name: string
  email: string
  avatarUrl?: string
  weightUnit?: 'kg' | 'lb'
}

export interface Pet {
  id?: string
  name: string
  birthDate?: string // YYYY-MM-DD
  weight: number
  imageBase64?: string
}

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
}

export interface DeviceLog {
  id: string
  deviceId: string
  petId?: string
  type: 'toileted' | 'manual-clean' | 'auto-clean' | 'flatten' | 'empty' | 'error' | 'tuya-raw-data' | 'reset-deodorizer'
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
    return user
  }

  const updateUser = async (updates: Partial<User>) => {
    const user = { ...updates }
    if (updates.email) user.avatarUrl = getGravatar(updates.email)
    await $fetch('/api/settings', { method: 'POST', body: { user } })
    return user
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
  const triggerClean = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'clean' } })
  }
  const triggerFlatten = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'flatten' } })
  }
  const triggerEmpty = async (deviceId: string) => {
    await $fetch('/api/action', { method: 'POST', body: { deviceId, action: 'empty' } })
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
    updateUser,
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    getDevice,
    getLogs,
    createEvent,
    triggerClean,
    triggerFlatten,
    triggerEmpty,
    getPets,
    addPet,
    updatePet,
    deletePet,
    resizeImage,
    clearCache
  }
}
