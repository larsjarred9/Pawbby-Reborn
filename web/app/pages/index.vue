<template>
  <div class="relative">
    <!-- Header -->
    <header class="flex justify-between items-center p-6 pb-4">
      <div class="w-6"></div> <!-- Spacer for centering -->
      <img src="/logo-nobg.png" alt="PAWBBY" class="h-12 object-contain" />
      <button @click="showAddModal = true" class="text-2xl text-white/80 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </header>

    <!-- Main Content -->
    <div class="px-4 py-2 space-y-4 pb-20">

      <!-- Empty State -->
      <div v-if="devices.length === 0" class="text-center py-10 bg-pawbby-card/30 rounded-2xl border border-white/5">
        <p class="text-pawbby-muted">No devices found. Tap the + to add your smart litter box.</p>
      </div>

      <!-- Device Cards -->
      <NuxtLink v-for="device in devices" :key="device.id" :to="`/litter-box?id=${device.id}`"
        class="bg-pawbby-card rounded-2xl p-5 flex relative overflow-hidden transition-transform transform hover:scale-[1.02] cursor-pointer shadow-lg border border-white/5 block">

        <div class="flex-1 z-10 flex flex-col justify-between min-h-[120px]">
          <div>
            <h2 class="text-lg font-semibold text-white/90 leading-tight pr-24">
              {{ device.name || 'PAWBBY Smart Litter Box' }}
            </h2>
            <div class="inline-block px-3 py-1 mt-2 rounded-full text-xs font-semibold border"
              :class="isDeviceOnline(device) ? 'bg-[#3D7A41]/20 text-[#3D7A41] border-[#3D7A41]/50' : 'bg-white/10 text-pawbby-muted border-white/5'">
              {{ isDeviceOnline(device) ? 'Online' : 'Offline' }}
            </div>
          </div>

          <div class="mt-8">
            <div class="flex items-baseline text-pawbby-secondary">
              <span class="text-4xl font-bold tracking-tighter">{{ device.todayToileted || 0 }}</span>
              <span class="text-sm font-semibold ml-1">times</span>
            </div>
            <p class="text-pawbby-mutedDark text-xs mt-1">Today Toileted</p>
          </div>
        </div>

        <div class="absolute right-[-10px] top-6 w-36 h-36 pointer-events-none drop-shadow-2xl">
          <img src="/litterbox.png" alt="Smart Litter Box" class="w-full h-full object-contain" />
        </div>
      </NuxtLink>
    </div>

    <!-- Add Device Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-md border border-white/10 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pawbby-primary to-pawbby-secondary"></div>

        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Add Smart Device</h2>
          <button @click="showAddModal = false" class="text-white/50 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Device Name</label>
            <input v-model="newDevice.name" type="text" placeholder="e.g. Living Room Litter Box"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>

          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Connection Mode</label>
            <select v-model="newDevice.mode" disabled
              class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none opacity-50 cursor-not-allowed">
              <option value="local">Local Network (Recommended)</option>
              <option value="cloud" disabled>Tuya Cloud (Coming Soon)</option>
            </select>
          </div>

          <div v-if="newDevice.mode === 'local'"
            class="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 flex items-start space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd" />
            </svg>
            <div class="text-xs text-blue-200">
              <p class="mb-1"><span class="font-bold">Need help finding these?</span> Extracting your Tuya Local Key
                requires a developer account.</p>
              <a href="https://github.com/codetheweb/tuyapi/blob/master/docs/SETUP.md" target="_blank"
                class="text-blue-400 hover:text-blue-300 underline font-medium">Read the official extraction guide</a>
            </div>
          </div>

          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Tuya Device ID</label>
            <input v-model="newDevice.deviceId" type="text" placeholder="Required"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>

          <div v-if="newDevice.mode === 'local'">
            <label class="block text-sm text-pawbby-muted mb-1">IP Address</label>
            <input v-model="newDevice.ipAddress" type="text"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-pawbby-primary mb-4" />

            <label class="block text-sm text-pawbby-muted mb-1">Local Key</label>
            <input v-model="newDevice.localKey" type="text"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>

          <button @click="handleAddDevice" :disabled="isSaving"
            class="w-full py-4 mt-4 bg-pawbby-primary text-black font-bold rounded-2xl hover:bg-pawbby-secondary transition-colors disabled:opacity-50 flex justify-center items-center">
            <span v-if="isSaving">Connecting...</span>
            <span v-else>Connect Device</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const api = useApi()
const devices = ref<any[]>([])
const showAddModal = ref(false)
const isSaving = ref(false)

const newDevice = ref({
  name: '',
  mode: 'local',
  deviceId: '',
  ipAddress: '',
  localKey: ''
})

const loadDevices = async () => {
  devices.value = await api.getDevices()
}

const handleAddDevice = async () => {
  if (!newDevice.value.deviceId) {
    alert("Device ID is required.")
    return
  }
  isSaving.value = true
  try {
    await api.createDevice(newDevice.value)
    await loadDevices()
    showAddModal.value = false
    // reset form
    newDevice.value = {
      name: '',
      mode: 'local',
      deviceId: '',
      ipAddress: '',
      localKey: ''
    }
  } catch (e) {
    alert("Failed to add device")
  } finally {
    isSaving.value = false
  }
}

const isDeviceOnline = (device: any) => {
  if (!device.lastHeartbeat) return false
  const hb = new Date(device.lastHeartbeat).getTime()
  const now = Date.now()
  // Devices actively ping every 5 mins, allow 7 mins before offline
  return (now - hb) < 420000
}

onMounted(() => {
  loadDevices()
})
</script>
