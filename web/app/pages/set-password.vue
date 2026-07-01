<template>
  <div class="min-h-screen bg-pawbby-dark flex items-center justify-center p-4">
    <div class="bg-pawbby-card rounded-3xl p-8 w-full max-w-md border border-white/5 relative overflow-hidden">
      <!-- Background glow -->
      <div class="absolute -top-32 -right-32 w-64 h-64 bg-[#3D7A41]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="text-center mb-8 relative">
        <img src="/logo-nobg.png" alt="PAWBBY" class="h-16 object-contain mx-auto mb-6 drop-shadow-[0_0_15px_rgba(61,122,65,0.3)]" />
        <h1 class="text-3xl font-bold text-white mb-2">Welcome to 0.4.0!</h1>
        <p class="text-pawbby-muted">To keep your local network secure, please create a dashboard password.</p>
      </div>

      <form @submit.prevent="handleSetPassword" class="space-y-5 relative z-10">
        <div>
          <label class="block text-sm font-medium text-pawbby-muted mb-2">Your Name</label>
          <input v-model="form.name" type="text" required placeholder="e.g. John Doe"
            class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#3D7A41] focus:ring-1 focus:ring-[#3D7A41] transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-pawbby-muted mb-2">Email Address</label>
          <input v-model="form.email" type="email" required placeholder="admin@local.network"
            class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#3D7A41] focus:ring-1 focus:ring-[#3D7A41] transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-pawbby-muted mb-2">New Password</label>
          <input v-model="form.password" type="password" required placeholder="••••••••"
            class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#3D7A41] focus:ring-1 focus:ring-[#3D7A41] transition-all" />
        </div>

        <p v-if="errorMsg" class="text-[#D84C4C] text-sm text-center py-2">{{ errorMsg }}</p>

        <button type="submit" :disabled="isLoading"
          class="w-full mt-8 py-4 bg-[#3D7A41] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#3D7A41]/20 hover:bg-[#3D7A41]/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Securing Dashboard...' : 'Secure Dashboard' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  name: '',
  email: '',
  password: ''
})
const isLoading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  try {
    const data = await $fetch('/api/auth/status')
    if (data.legacyName) form.value.name = data.legacyName
    if (data.legacyEmail) form.value.email = data.legacyEmail
  } catch (e) {}
})

async function handleSetPassword() {
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    await $fetch('/api/auth/setup', {
      method: 'POST',
      body: form.value
    })
    // Force hard reload to re-run middleware and grant access
    window.location.href = '/'
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || 'An error occurred.'
  } finally {
    isLoading.value = false
  }
}
</script>
