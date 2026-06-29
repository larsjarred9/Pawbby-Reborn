<template>
  <div class="px-4 py-6 space-y-8 relative">
    
    <!-- User Profile Header -->
    <div class="flex items-center justify-between cursor-pointer" @click="openEditProfile">
      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
          <img v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user.name" class="w-full h-full object-cover" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-pawbby-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white/90">{{ user?.name || 'User' }}</h2>
          <div class="flex items-center mt-1 bg-white/10 rounded-full px-2 py-0.5 text-xs text-pawbby-muted">
            <span class="truncate max-w-[120px]">{{ user?.email || 'No email' }}</span>
            <button class="ml-2 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="text-pawbby-muted">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- My Pets Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between text-white/90">
        <div class="flex items-center">
          <h3 class="text-lg font-semibold">My Pets</h3>
          <span class="mx-2 text-pawbby-mutedDark">&middot;</span>
          <span class="font-semibold">{{ pets.length }}</span>
        </div>
      </div>
      
      <div class="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        <!-- Dynamic Pets -->
        <div v-for="pet in pets" :key="pet.id" class="flex flex-col items-center space-y-2 min-w-[64px] cursor-pointer" @click="openEditPet(pet)">
          <div class="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 bg-white/5">
            <img v-if="pet.imageBase64" :src="pet.imageBase64" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-pawbby-muted text-xs">No img</div>
          </div>
          <span class="text-xs text-pawbby-muted">{{ pet.name }}</span>
        </div>
        
        <!-- Add Button -->
        <div class="flex flex-col items-center space-y-2 min-w-[64px]">
          <button @click="openAddPet" class="w-16 h-16 rounded-2xl bg-pawbby-card flex items-center justify-center text-pawbby-muted hover:text-white transition-colors border border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Menu Links -->
    <div class="space-y-6 pt-4">
      <NuxtLink to="/settings" class="w-full flex items-center justify-between text-white/80 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="font-medium text-lg">Settings</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </NuxtLink>

      <NuxtLink to="/about" class="w-full flex items-center justify-between text-white/80 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium text-lg">About PAWBBY Reborn</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-pawbby-mutedDark">V0.1</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </NuxtLink>
    </div>

    <!-- GitHub Link Card -->
    <div class="pt-4">
      <a href="https://github.com/larsjarred9/Pawby-Reborn/" target="_blank" class="bg-gradient-to-r from-[#24292e] to-pawbby-card/80 rounded-2xl h-20 flex items-center justify-between px-6 cursor-pointer border border-white/5 hover:border-white/20 transition-colors">
        <div class="flex items-center space-x-4">
          <div class="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white/90">View on GitHub</h3>
            <p class="text-xs text-pawbby-muted mt-0.5">Pawby-Reborn Repository</p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-muted" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </a>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="isEditProfileOpen" class="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-pawbby-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10 animate-fade-in-up">
        <h3 class="text-xl font-bold text-white mb-4">Edit Profile</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Name</label>
            <input v-model="profileForm.name" type="text" class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Email (Gravatar)</label>
            <input v-model="profileForm.email" type="email" class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button @click="isEditProfileOpen = false" class="flex-1 px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button @click="saveProfile" class="flex-1 px-4 py-2 rounded-xl bg-pawbby-primary text-pawbby-bg font-semibold hover:bg-pawbby-secondary transition-colors">Save</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Pet Modal -->
    <div v-if="isEditPetOpen" class="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-pawbby-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10 animate-fade-in-up">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-white">{{ isEditingPetId ? 'Edit Pet' : 'Add Pet' }}</h3>
          <button v-if="isEditingPetId" @click="deletePet" class="text-red-400 hover:text-red-300 transition-colors text-sm font-medium">Delete</button>
        </div>
        
        <div class="space-y-4">
          <div class="flex flex-col items-center">
            <div class="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-black/30 relative group cursor-pointer" @click="$refs.fileInput.click()">
              <img v-if="petForm.imageBase64" :src="petForm.imageBase64" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-pawbby-muted">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                Upload
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
          </div>

          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Name</label>
            <input v-model="petForm.name" type="text" class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>
          <div class="flex space-x-3">
            <div class="flex-1">
              <label class="block text-sm text-pawbby-muted mb-1">Birthday</label>
              <input v-model="petForm.birthDate" type="date" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pawbby-primary appearance-none [&::-webkit-calendar-picker-indicator]:invert-[0.6]" />
            </div>
            <div class="flex-1">
              <label class="block text-sm text-pawbby-muted mb-1 truncate">Weight ({{ user?.weightUnit || 'kg' }})</label>
              <input v-model.number="petForm.weight" type="number" step="0.1" class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
            </div>
          </div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button @click="isEditPetOpen = false" class="flex-1 px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button @click="savePet" class="flex-1 px-4 py-2 rounded-xl bg-pawbby-primary text-pawbby-bg font-semibold hover:bg-pawbby-secondary transition-colors">Save</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi, type User, type Pet } from '~/composables/useApi'

const api = useApi()

const user = ref<User | null>(null)
const pets = ref<Pet[]>([])

const loadData = async () => {
  user.value = await api.getUser()
  pets.value = await api.getPets()
}

onMounted(() => {
  loadData()
})

// Profile Edit Modal
const isEditProfileOpen = ref(false)
const profileForm = ref({ name: '', email: '' })

const openEditProfile = () => {
  if (user.value) {
    profileForm.value.name = user.value.name
    profileForm.value.email = user.value.email
  }
  isEditProfileOpen.value = true
}

const saveProfile = async () => {
  if (!user.value) return
  await api.updateUser({ name: profileForm.value.name, email: profileForm.value.email })
  await loadData()
  isEditProfileOpen.value = false
}

// Pet Edit Modal
const isEditPetOpen = ref(false)
const petForm = ref<Partial<Pet>>({ name: '', birthDate: '', weight: 0, imageBase64: '' })
const isEditingPetId = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const displayWeight = (weightInKg: number) => {
  if (user.value?.weightUnit === 'lb') {
    return (weightInKg * 2.20462).toFixed(1)
  }
  return weightInKg.toFixed(1)
}

const openAddPet = () => {
  isEditingPetId.value = null
  petForm.value = { name: '', birthDate: '', weight: 0, imageBase64: '' }
  isEditPetOpen.value = true
}

const openEditPet = (pet: Pet) => {
  isEditingPetId.value = pet.id
  petForm.value = { ...pet }
  if (user.value?.weightUnit === 'lb') {
    petForm.value.weight = Number((pet.weight * 2.20462).toFixed(1))
  }
  isEditPetOpen.value = true
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    petForm.value.imageBase64 = await api.resizeImage(target.files[0])
  }
}

const savePet = async () => {
  const finalWeight = user.value?.weightUnit === 'lb' 
    ? Number(((petForm.value.weight || 0) / 2.20462).toFixed(2))
    : Number(petForm.value.weight || 0)
    
  const payload = { ...petForm.value, weight: finalWeight }

  if (isEditingPetId.value) {
    await api.updatePet(isEditingPetId.value, payload as Partial<Pet>)
  } else {
    await api.addPet(payload as Omit<Pet, 'id'>)
  }
  await loadData()
  isEditPetOpen.value = false
}

const deletePet = async () => {
  if (isEditingPetId.value) {
    await api.deletePet(isEditingPetId.value)
    await loadData()
    isEditPetOpen.value = false
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
