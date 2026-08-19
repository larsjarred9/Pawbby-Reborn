<template>
  <div class="flex flex-col min-h-screen pb-10 px-4 pt-6 relative">
    <header class="flex items-center mb-8">
      <NuxtLink to="/profile" class="text-white hover:text-white/80 transition-colors p-2 -ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-xl font-bold text-white/90 flex-1 text-center pr-8">User Management</h1>
    </header>

    <div class="space-y-4">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-semibold text-white/90">Local Accounts</h2>
        <button @click="isAddModalOpen = true" class="bg-pawbby-primary text-black font-semibold px-4 py-2 rounded-xl text-sm hover:bg-pawbby-secondary transition-colors">
          + Add User
        </button>
      </div>
      
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pawbby-primary"></div>
      </div>
      
      <div v-else class="space-y-3">
        <div v-for="u in users" :key="u.id" class="bg-pawbby-card rounded-2xl p-4 border border-white/5 flex justify-between items-center group hover:bg-white/5 transition-colors">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-white font-semibold">{{ u.name }}</h3>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" :class="u.role === 'ADMIN' ? 'bg-[#3D7A41]/20 text-[#3D7A41]' : 'bg-white/10 text-pawbby-muted'">
                {{ u.role || 'USER' }}
              </span>
            </div>
            <p class="text-xs text-pawbby-muted mt-1">{{ u.email }}</p>
          </div>
          
          <button v-if="u.id !== currentUser?.id" @click="confirmDelete(u)" class="text-red-400 hover:text-red-300 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-pawbby-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10 animate-fade-in-up">
        <h3 class="text-xl font-bold text-white mb-4">Add Sub-User</h3>
        <p class="text-sm text-pawbby-muted mb-4">Create an additional read-only account for your household.</p>
        
        <form @submit.prevent="handleAddUser" class="space-y-4">
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Display Name</label>
            <input v-model="addForm.name" type="text" required placeholder="e.g. Jane Doe"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Email Address</label>
            <input v-model="addForm.email" type="email" required placeholder="user@local.network"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Password</label>
            <input v-model="addForm.password" type="password" required placeholder="••••••••"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>
          
          <p v-if="errorMsg" class="text-[#D84C4C] text-xs">{{ errorMsg }}</p>

          <div class="flex space-x-3 mt-6">
            <button type="button" @click="closeAddModal" class="flex-1 px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" :disabled="isSaving" class="flex-1 px-4 py-2 rounded-xl bg-pawbby-primary text-pawbby-bg font-semibold hover:bg-pawbby-secondary transition-colors disabled:opacity-50">
              {{ isSaving ? 'Adding...' : 'Add User' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi, type User } from '~/composables/useApi'

definePageMeta({
  layout: 'detail'
})

const api = useApi()
const users = ref<User[]>([])
const currentUser = ref<User | null>(null)
const isLoading = ref(true)

const isAddModalOpen = ref(false)
const isSaving = ref(false)
const errorMsg = ref('')
const addForm = ref({ name: '', email: '', password: '' })

const loadUsers = async () => {
  isLoading.value = true
  try {
    currentUser.value = await api.getUser()
    users.value = await api.getUsers()
  } catch (e) {
    console.error('Failed to load users', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

const confirmDelete = async (userToDelete: User) => {
  if (confirm(`Are you sure you want to delete ${userToDelete.name}'s account?`)) {
    try {
      if (userToDelete.id) {
        await api.deleteUser(userToDelete.id)
        await loadUsers()
      }
    } catch (e) {
      alert('Failed to delete user')
    }
  }
}

const closeAddModal = () => {
  isAddModalOpen.value = false
  errorMsg.value = ''
  addForm.value = { name: '', email: '', password: '' }
}

const handleAddUser = async () => {
  isSaving.value = true
  errorMsg.value = ''
  try {
    await api.addUser(addForm.value)
    await loadUsers()
    closeAddModal()
  } catch (err: any) {
    errorMsg.value = err.data?.statusMessage || 'An error occurred while creating the user.'
  } finally {
    isSaving.value = false
  }
}
</script>
