<template>
  <div class="flex flex-col min-h-screen pb-10 px-4 pt-6">
    <!-- Header -->
    <header class="flex items-center mb-8">
      <NuxtLink to="/profile" class="text-white hover:text-white/80 transition-colors p-2 -ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-xl font-bold text-white/90 flex-1 text-center pr-8">Settings</h1>
    </header>

    <!-- Menu Links -->
    <div class="space-y-6">

      <!-- Unit of Weight -->
      <button @click="toggleWeightUnit"
        class="w-full flex items-center justify-between text-white/90 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <span class="font-medium text-lg">Unit of Weight</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors uppercase">{{
            user?.weightUnit || 'kg' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Language -->
      <button class="w-full flex items-center justify-between text-white/90 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span class="font-medium text-lg">Language</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors">English</span>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Check for Updates -->
      <button @click="handleUpdateClick" class="w-full flex items-center justify-between text-white/90 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="font-medium text-lg">Check for Updates</span>
        </div>
        <div class="flex items-center space-x-2">
          <span v-if="checking" class="text-sm text-pawbby-mutedDark">Checking...</span>
          <span v-else-if="updateAvailable" class="text-sm text-[#3D7A41]">Update Available!</span>
          <span v-else-if="!updateAvailable && hasChecked" class="text-sm text-pawbby-mutedDark">Up to date</span>
          
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </div>
      </button>

    </div>



    <!-- Clear Data -->
    <div class="mt-auto pt-8 pb-4 space-y-6">
      <button @click="doClearCache"
        class="w-full text-center py-4 text-[#D84C4C] font-semibold text-lg hover:bg-white/5 rounded-2xl transition-colors">
        Remove stored information
      </button>
    </div>

    <!-- Upgrade Instructions Modal -->
    <div v-if="showUpgradeModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden">
        <div class="w-16 h-16 bg-[#3D7A41]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3D7A41]/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#3D7A41]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2 text-center">Update Available!</h2>
        <p class="text-pawbby-muted text-sm mb-6 text-center">
          A new version of the dashboard is available. To safely upgrade, open your terminal and run the following command in the project root:
        </p>
        <div class="bg-black/50 rounded-xl p-4 mb-6 border border-white/5 flex items-center justify-center">
          <code class="text-pawbby-primary font-mono text-sm">./upgrade.sh</code>
        </div>
        <button @click="showUpgradeModal = false" class="w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors">
          Got it
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi, type User } from '~/composables/useApi'

definePageMeta({
  layout: 'detail'
})

const api = useApi()
const router = useRouter()
const user = ref<User | null>(null)

const checking = ref(false)
const hasChecked = ref(false)
const updateAvailable = ref(false)
const showUpgradeModal = ref(false)

const handleUpdateClick = () => {
  if (updateAvailable.value) {
    showUpgradeModal.value = true
  } else {
    checkForUpdates()
  }
}

const checkForUpdates = async (silent = false) => {
  if (!silent) checking.value = true
  hasChecked.value = true
  try {
    const res = await fetch('/api/update')
    const data = await res.json()
    if (data.updateAvailable) {
      updateAvailable.value = true
    } else {
      updateAvailable.value = false
    }
  } catch (e) {
    console.error('Failed to check for updates', e)
  } finally {
    if (!silent) checking.value = false
  }
}

const loadData = async () => {
  user.value = await api.getUser()
}

onMounted(() => {
  loadData()
  checkForUpdates(true)
})

const toggleWeightUnit = async () => {
  if (!user.value) return
  const newUnit = user.value.weightUnit === 'kg' ? 'lb' : 'kg'
  await api.updateUser({ weightUnit: newUnit })
  await loadData()
}

const doClearCache = async () => {
  if (confirm('Are you sure you want to clear all stored data? This will reset your profile and pets.')) {
    await api.clearCache()
    alert('Cache cleared. The app will now reload.')
    window.location.reload()
  }
}
</script>
