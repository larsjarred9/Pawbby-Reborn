<template>
  <div class="flex flex-col min-h-screen pb-10">
    <!-- Header -->
    <header class="flex justify-between items-center p-4">
      <NuxtLink to="/" class="text-white p-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <div class="flex items-center space-x-3">
        <h1 class="text-lg font-bold text-white/90">{{ device?.name || 'PAWBBY Litter Box' }}</h1>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
          :class="isOnline ? 'bg-[#3D7A41]/20 text-[#3D7A41] border-[#3D7A41]/50' : 'bg-white/10 text-pawbby-muted border-white/5'">
          {{ isOnline ? 'Online' : 'Offline' }}
        </span>
      </div>
      <button v-if="user?.role === 'ADMIN'" @click="openSettings" class="text-white p-2 hover:text-white/80 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>
    </header>

    <!-- Product Image & Overlay Stats -->
    <div class="relative w-full flex justify-center mt-2 mb-6">
      <div class="w-64 h-64 relative">
        <img src="/litterbox.png" alt="Smart Litter Box" class="w-full h-full object-contain drop-shadow-2xl" />
        <!-- Overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
          <div v-if="device?.binRemoved"
            class="bg-[#D84C4C]/90 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Bin Removed</span>
          </div>
          <div v-else-if="device?.status === 'Drum Removed'"
            class="bg-amber-600/90 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Drum Removed</span>
          </div>
          <div v-else-if="device?.lidOpen"
            class="bg-orange-500/90 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Lid Removed</span>
          </div>
          <div v-else-if="device?.status === 'Bin Full'"
            class="bg-[#D84C4C]/90 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center space-x-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Bin Full</span>
          </div>
          <template v-else>
            <div class="flex items-baseline text-pawbby-secondary">
              <span class="text-5xl font-bold tracking-tighter">{{ device?.todayToileted || 0 }}</span>
              <span class="text-sm font-semibold ml-1">times</span>
            </div>
            <p class="text-pawbby-mutedDark text-xs mt-1">Today Toileted</p>
          </template>
        </div>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="px-4 grid grid-cols-3 gap-3 mb-8">
      <div
        class="bg-pawbby-card rounded-xl p-3 flex flex-col items-center justify-center space-y-2 border border-white/5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        <span class="text-sm font-semibold text-white/90 text-center">{{ device?.litterLevel || '-' }}</span>
      </div>
      <div
        class="bg-pawbby-card rounded-xl p-3 flex flex-col items-center justify-center space-y-2 border border-white/5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span class="text-sm font-semibold text-white/90 text-center">{{ device?.wasteBin || '-' }}</span>
      </div>
      <div @click="user?.role === 'ADMIN' && (showDeodorizerModal = true)"
        :class="['bg-pawbby-card rounded-xl p-3 flex flex-col items-center justify-center space-y-2 border border-white/5', user?.role === 'ADMIN' ? 'cursor-pointer hover:bg-white/5 transition-colors' : '']">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="1.5">
          <rect x="7" y="10" width="10" height="10" rx="3" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 7c0-1 1.5-1.5 1.5-3m3 3c0-1 1.5-1.5 1.5-3" />
        </svg>
        <span class="text-sm font-semibold text-white/90 text-center">{{ deodorizerDaysLeft }} Days</span>
      </div>
    </div>

    <!-- Tabs Container -->
    <div class="bg-pawbby-card/50 rounded-t-3xl flex-1 px-4 py-6 border-t border-white/5">
      <!-- Tabs -->
      <div class="flex justify-around mb-6 border-b border-white/10 pb-2">
        <div @click="activeTab = 'record'" class="flex flex-col items-center space-y-1 cursor-pointer">
          <span
            :class="[activeTab === 'record' ? 'text-white font-bold' : 'text-pawbby-muted hover:text-white/80', 'text-lg transition-colors']">Record</span>
          <div :class="[activeTab === 'record' ? 'bg-pawbby-primary' : 'bg-transparent', 'w-4 h-1 rounded-full']"></div>
        </div>
        <div @click="activeTab = 'history'" class="flex flex-col items-center space-y-1 cursor-pointer">
          <span
            :class="[activeTab === 'history' ? 'text-white font-bold' : 'text-pawbby-muted hover:text-white/80', 'text-lg transition-colors']">History</span>
          <div :class="[activeTab === 'history' ? 'bg-pawbby-primary' : 'bg-transparent', 'w-4 h-1 rounded-full']">
          </div>
        </div>
        <div @click="activeTab = 'control'" class="flex flex-col items-center space-y-1 cursor-pointer">
          <span
            :class="[activeTab === 'control' ? 'text-white font-bold' : 'text-pawbby-muted hover:text-white/80', 'text-lg transition-colors']">Control</span>
          <div :class="[activeTab === 'control' ? 'bg-pawbby-primary' : 'bg-transparent', 'w-4 h-1 rounded-full']">
          </div>
        </div>
        <div @click="activeTab = 'settings'" class="flex flex-col items-center space-y-1 cursor-pointer">
          <span
            :class="[activeTab === 'settings' ? 'text-white font-bold' : 'text-pawbby-muted hover:text-white/80', 'text-lg transition-colors']">Settings</span>
          <div :class="[activeTab === 'settings' ? 'bg-pawbby-primary' : 'bg-transparent', 'w-4 h-1 rounded-full']">
          </div>
        </div>
      </div>

      <!-- Record Content -->
      <div v-if="activeTab === 'record'" class="space-y-4 animate-fade-in">
        <div class="flex justify-between items-center relative">
          <h3 class="text-white/90 font-semibold text-lg">Detailed Record</h3>

          <!-- Date Picker -->
          <div class="relative">
            <input type="date" v-model="selectedDateFilter" :min="minDate" :max="maxDate"
              class="bg-white/10 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pawbby-primary cursor-pointer [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
          </div>
        </div>

        <p class="text-pawbby-muted text-sm leading-relaxed">
          PawID matches cats based on their weight, so please update it promptly if there are any changes in your cat's
          weight.
        </p>

        <!-- Pet Chips -->
        <div class="flex space-x-2 overflow-x-auto scrollbar-hide py-2">
          <button @click="selectedPetFilter = 'all'"
            :class="[selectedPetFilter === 'all' ? 'bg-pawbby-primary/20 border-pawbby-primary text-pawbby-secondary' : 'bg-white/5 border-white/10 text-pawbby-muted hover:text-white', 'relative flex items-center border rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors']">
            <span>All</span>
            <div v-if="getAllLogCount > 0"
              class="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-pawbby-secondary text-[10px] font-bold text-pawbby-bg shadow-sm">
              {{ getAllLogCount }}
            </div>
          </button>

          <!-- Dynamic Pets from State -->
          <button v-for="pet in pets" :key="pet.id" @click="selectedPetFilter = pet.id"
            :class="[selectedPetFilter === pet.id ? 'bg-pawbby-primary/20 border-pawbby-primary text-pawbby-secondary' : 'bg-white/5 border-white/10 text-pawbby-muted hover:text-white', 'relative flex items-center border rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors']">
            <span>{{ pet.name }}</span>
            <div v-if="getPetLogCount(pet.id) > 0"
              class="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-pawbby-secondary text-[10px] font-bold text-pawbby-bg shadow-sm">
              {{ getPetLogCount(pet.id) }}
            </div>
          </button>
        </div>

        <!-- Timeline List -->
        <div class="space-y-6 pt-4">

          <div v-for="log in filteredLogs" :key="log.id" 
               class="flex space-x-4"
               :class="{ 'cursor-pointer hover:bg-white/5 rounded-xl p-2 -mx-2 transition-colors': log.type === 'toileted' || log.type === 'quick-visit' }"
               @click="(log.type === 'toileted' || log.type === 'quick-visit') ? openAssignPetModal(log) : null">
            <div class="flex-shrink-0 mt-1">

              <!-- Icon Logic Based on Log Type -->
              <div v-if="log.type === 'auto-clean'"
                class="w-8 h-8 rounded-lg bg-[#3D7A41]/20 flex items-center justify-center text-[#3D7A41]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'flatten' || log.type === 'flatten-app' || log.type === 'auto-flatten'"
                class="w-8 h-8 rounded-lg bg-[#2A6372]/20 flex items-center justify-center text-[#2A6372]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </div>

              <div v-else-if="log.type === 'empty' || log.type === 'empty-app'"
                class="w-8 h-8 rounded-lg bg-[#D84C4C]/20 flex items-center justify-center text-[#D84C4C]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div v-else-if="log.type === 'reset-deodorizer'"
                class="w-8 h-8 rounded-lg bg-pawbby-primary/20 flex items-center justify-center text-pawbby-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="1.5">
                  <rect x="7" y="10" width="10" height="10" rx="3" />
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 7c0-1 1.5-1.5 1.5-3m3 3c0-1 1.5-1.5 1.5-3" />
                </svg>
              </div>

              <div v-else-if="log.type === 'manual-clean' || log.type === 'manual-clean-app'"
                class="w-8 h-8 rounded-lg bg-[#3D7A41] flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div v-else-if="log.type === 'lid-removed'"
                class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'lid-replaced'"
                class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'bin-removed'"
                class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div v-else-if="log.type === 'bin-replaced'"
                class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'litter-added'"
                class="w-8 h-8 rounded-lg bg-pawbby-primary/20 flex items-center justify-center text-pawbby-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>

              <div v-else-if="log.type === 'litter-removed'"
                class="w-8 h-8 rounded-lg bg-[#D84C4C]/20 flex items-center justify-center text-[#D84C4C]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
                </svg>
              </div>

              <div v-else-if="log.type === 'bin-full'"
                class="w-8 h-8 rounded-lg bg-[#D84C4C]/20 flex items-center justify-center text-[#D84C4C]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'bin-normal'"
                class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'drum-removed'"
                class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'drum-installed'"
                class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'litter-low'"
                class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div v-else-if="log.type === 'litter-sufficient'"
                class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div
                v-else-if="(log.type === 'toileted' || log.type === 'quick-visit') && getPetInfo(log.petId)?.imageBase64"
                class="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                <img :src="getPetInfo(log.petId)?.imageBase64" class="w-full h-full object-cover" />
              </div>

              <div v-else class="w-8 h-8 rounded-lg bg-pawbby-card flex items-center justify-center text-pawbby-muted">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

            </div>
            <div class="flex-1">
              <p class="text-white/90 text-base leading-snug">{{ log.description }}</p>
              <div class="flex items-center justify-between mt-1">
                <p class="text-pawbby-mutedDark text-xs">{{ log.timestamp }}</p>
                <div v-if="(log.type === 'toileted' || log.type === 'quick-visit') && !log.petId" 
                     class="text-pawbby-primary text-xs font-semibold flex items-center space-x-1">
                  <span>Assign</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredLogs.length === 0" class="text-center text-pawbby-muted py-8">
            No records found.
          </div>

        </div>
      </div>
      <!-- History Content -->
      <div v-if="activeTab === 'history'" class="space-y-6 animate-fade-in py-4">
        <h3 class="text-white/90 font-semibold text-lg text-center mb-4">Historical Data</h3>

        <!-- Chart Selector -->
        <div class="relative w-full mb-6">
          <select v-model="selectedChart"
            class="w-full bg-pawbby-card border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pawbby-primary appearance-none font-medium">
            <option value="visits">Daily Visit Count</option>
            <option value="weight">Average Weight ({{ user?.weightUnit === 'lb' ? 'lbs' : 'kg' }})</option>
            <option value="duration">Average Duration (seconds)</option>
            <option value="waste">Estimated Waste Output (g)</option>
          </select>
          <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-muted" viewBox="0 0 20 20"
              fill="currentColor">
              <path fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div v-if="historyLoading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pawbby-primary"></div>
        </div>

        <div v-else-if="currentChartData" class="bg-pawbby-card border border-white/5 rounded-2xl p-4">
          <Bar v-if="selectedChart === 'visits' || selectedChart === 'waste'" :data="currentChartData"
            :options="chartOptions" class="w-full h-64" />
          <Line v-else :data="currentChartData" :options="chartOptions" class="w-full h-64" />
        </div>

        <div v-else class="text-center text-pawbby-muted py-8">
          No historical data available.
        </div>
      </div>

      <!-- Control Content -->
      <div v-if="activeTab === 'control'" class="space-y-6 animate-fade-in py-4">
        <h3 class="text-white/90 font-semibold text-lg text-center mb-6">Device Controls</h3>

        <div class="grid grid-cols-1 gap-4">
          <button @click="confirmClean" :disabled="isBusy"
            class="bg-pawbby-card border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <div class="flex items-center space-x-4">
              <div class="bg-[#3D7A41] p-3 rounded-xl text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div class="text-left">
                <h4 class="text-white font-semibold text-lg">Clean Litter</h4>
                <p class="text-pawbby-muted text-sm mt-1">Start a cleaning cycle</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-muted" viewBox="0 0 20 20"
              fill="currentColor">
              <path fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd" />
            </svg>
          </button>

          <button @click="confirmFlatten" :disabled="isBusy"
            class="bg-pawbby-card border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <div class="flex items-center space-x-4">
              <div class="bg-[#2A6372] p-3 rounded-xl text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <div class="text-left">
                <h4 class="text-white font-semibold text-lg">Flatten Litter</h4>
                <p class="text-pawbby-muted text-sm mt-1">Level the litter surface</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-muted" viewBox="0 0 20 20"
              fill="currentColor">
              <path fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd" />
            </svg>
          </button>

          <button @click="confirmEmpty" :disabled="isBusy"
            class="bg-pawbby-card border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <div class="flex items-center space-x-4">
              <div class="bg-pawbby-primary p-3 rounded-xl text-pawbby-bg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div class="text-left">
                <h4 class="text-white font-semibold text-lg">Empty Litter Box</h4>
                <p class="text-pawbby-muted text-sm mt-1">Dump all litter into waste bin</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-muted" viewBox="0 0 20 20"
              fill="currentColor">
              <path fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd" />
            </svg>
          </button>

          <button @click="confirmTare" :disabled="isBusy"
            class="bg-pawbby-card border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <div class="flex items-center space-x-4">
              <div class="bg-indigo-600/80 p-3 rounded-xl text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div class="text-left">
                <h4 class="text-white font-semibold text-lg">Zero / Tare Scale</h4>
                <p class="text-pawbby-muted text-sm mt-1">Calibrate empty scale to 0g</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-muted" viewBox="0 0 20 20"
              fill="currentColor">
              <path fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Settings Content -->
      <div v-if="activeTab === 'settings'" class="space-y-6 animate-fade-in py-4">
        <!-- Hardware Settings (DP 105 / DP 103) -->
        <h3 class="text-white/90 font-semibold text-lg text-center mb-2">Litter Box Settings</h3>

        <div v-if="!effectiveSettings"
          class="bg-pawbby-card border border-white/10 p-5 rounded-2xl text-center text-pawbby-muted text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto mb-2 animate-spin text-pawbby-primary" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Waiting for the litter box to report its settings.<br />
          <span class="text-xs text-pawbby-mutedDark">A first snapshot was requested; the box answers within a few seconds when it is online.</span>
        </div>

        <div v-else class="bg-pawbby-card border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">

          <!-- Toggle rows -->
          <div v-for="row in settingToggles" :key="row.key" class="flex items-center justify-between p-5">
            <div class="flex items-center space-x-4 min-w-0">
              <div :class="[row.color, 'p-3 rounded-xl text-white shrink-0']" v-html="row.icon"></div>
              <div class="text-left min-w-0">
                <h4 class="text-white font-semibold">{{ row.title }}</h4>
                <p class="text-pawbby-muted text-xs mt-0.5">{{ row.hint }}</p>
              </div>
            </div>
            <button type="button" role="switch" :aria-checked="effectiveSettings[row.field] ? 'true' : 'false'"
              :disabled="settingBusy[row.key]" @click="setToggle(row.key, row.field)"
              :class="[effectiveSettings[row.field] ? 'bg-pawbby-primary' : 'bg-white/15', settingBusy[row.key] ? 'opacity-50' : '', 'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ml-4']">
              <span :class="[effectiveSettings[row.field] ? 'translate-x-6' : 'translate-x-1', 'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform']"></span>
            </button>
          </div>

          <!-- Auto-clean delay -->
          <div class="flex items-center justify-between p-5">
            <div class="flex items-center space-x-4 min-w-0">
              <div class="bg-[#3D7A41] p-3 rounded-xl text-white shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-left">
                <h4 class="text-white font-semibold">Auto-clean delay</h4>
                <p class="text-pawbby-muted text-xs mt-0.5">How long to wait after your cat leaves before cleaning</p>
              </div>
            </div>
            <select :value="effectiveSettings.autoCleanDelayMin" :disabled="settingBusy.auto_clean_delay"
              @change="setDelay(($event.target as HTMLSelectElement).value)"
              class="ml-4 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-pawbby-primary disabled:opacity-50">
              <option v-for="m in 60" :key="m" :value="m">{{ m }} min</option>
            </select>
          </div>

          <!-- Quiet period (sleep mode toggle + window) -->
          <div class="p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 min-w-0">
                <div class="bg-indigo-600/80 p-3 rounded-xl text-white shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div class="text-left min-w-0">
                  <h4 class="text-white font-semibold">Quiet period</h4>
                  <p class="text-pawbby-muted text-xs mt-0.5">
                    <span v-if="effectiveSettings.sleepEnabled">Auto-clean pauses from {{ effectiveSettings.sleepStart }} to {{ effectiveSettings.sleepStop }}</span>
                    <span v-else>Pause auto-clean during the night or set hours</span>
                  </p>
                </div>
              </div>
              <button type="button" role="switch" :aria-checked="effectiveSettings.sleepEnabled ? 'true' : 'false'"
                :disabled="settingBusy.sleep_mode" @click="setToggle('sleep_mode', 'sleepEnabled')"
                :class="[effectiveSettings.sleepEnabled ? 'bg-pawbby-primary' : 'bg-white/15', settingBusy.sleep_mode ? 'opacity-50' : '', 'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ml-4']">
                <span :class="[effectiveSettings.sleepEnabled ? 'translate-x-6' : 'translate-x-1', 'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform']"></span>
              </button>
            </div>

            <div v-if="effectiveSettings.sleepEnabled" class="mt-4 pl-0 sm:pl-[4.5rem] animate-fade-in">
              <div class="flex items-center gap-3 flex-wrap">
                <label class="flex items-center gap-2 text-sm text-pawbby-muted">
                  <span>From</span>
                  <input type="time" v-model="sleepForm.start"
                    class="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pawbby-primary [color-scheme:dark]" />
                </label>
                <label class="flex items-center gap-2 text-sm text-pawbby-muted">
                  <span>to</span>
                  <input type="time" v-model="sleepForm.stop"
                    class="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pawbby-primary [color-scheme:dark]" />
                </label>
                <button @click="saveSleepWindow" :disabled="settingBusy.sleep_window || !sleepWindowDirty"
                  class="ml-auto px-4 py-2 bg-pawbby-primary text-black font-semibold rounded-xl hover:bg-pawbby-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                  <span v-if="settingBusy.sleep_window">Saving…</span>
                  <span v-else>Save</span>
                </button>
              </div>
              <p v-if="sleepWindowHours !== null && (sleepWindowHours < 1 || sleepWindowHours > 12)" class="text-xs text-amber-400/90 mt-2">
                The original app recommended a window between 1 and 12 hours ({{ sleepWindowHours.toFixed(1) }} h selected).
              </p>
              <p class="text-xs text-pawbby-mutedDark mt-2">Times follow the box's clock, which is kept in sync with your account time zone ({{ user?.timezone || 'UTC' }}).</p>
            </div>
          </div>

          <!-- Litter type Row (Opens Modal) -->
          <div class="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" @click="showLitterModal = true">
            <div class="flex items-center space-x-4 min-w-0">
              <div class="bg-pawbby-brown p-3 rounded-xl text-white shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div class="text-left min-w-0">
                <h4 class="text-white font-semibold">Litter type</h4>
                <p class="text-pawbby-muted text-xs mt-0.5">Calibrates the drum scale for your litter density</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-4">
              <span class="px-3.5 py-1.5 rounded-xl bg-white/10 text-white font-medium text-sm flex items-center gap-2 border border-white/5 hover:border-white/20 transition-all">
                <span class="w-2 h-2 rounded-full bg-pawbby-primary"></span>
                {{ currentLitterName }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-muted" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>

          <!-- Deodorizer pod counter on the device.
               Disabled on purpose (SHOW_DEVICE_DEODORANT_RESET = false): the firmware counter is
               fixed at 60 days, so the dashboard's own pod tracker (30/60 days, deodorizer modal)
               is used instead. The DP 105 reset command stays available via the API. -->
          <div v-if="SHOW_DEVICE_DEODORANT_RESET" class="p-5 flex items-center justify-between">
            <div class="flex items-center space-x-4 min-w-0">
              <div class="bg-pawbby-brown p-3 rounded-xl text-white shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div class="text-left min-w-0">
                <h4 class="text-white font-semibold">Deodorizing pod counter</h4>
                <p class="text-pawbby-muted text-xs mt-0.5">Firmware reports <span class="text-white/80">{{ effectiveSettings.deodorantDays }} days</span> left — reset after inserting a new pod</p>
              </div>
            </div>
            <button @click="resetDeviceDeodorant" :disabled="settingBusy.reset_deodorant"
              class="ml-4 px-4 py-2 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 text-sm shrink-0">
              <span v-if="settingBusy.reset_deodorant">Resetting…</span>
              <span v-else>Reset</span>
            </button>
          </div>

          <div class="px-5 py-3 flex items-center justify-between text-xs text-pawbby-mutedDark bg-black/10">
            <span v-if="settingBusy.refresh" class="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Waiting for the device…
            </span>
            <span v-else>Reported by the device {{ settingsAge }}</span>
            <span v-if="settingError" class="text-[#D84C4C]">{{ settingError }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-md border border-white/10 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Device Settings</h2>
          <button @click="showSettingsModal = false" class="text-white/50 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Device Name</label>
            <input v-model="editDevice.name" type="text"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-pawbby-primary" />
          </div>

          <details class="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
            <summary
              class="px-4 py-3 text-white/80 font-medium cursor-pointer hover:bg-white/5 transition-colors select-none focus:outline-none flex justify-between items-center">
              <span>Connection Information</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="p-4 pt-0 space-y-4 mt-2">
              <div>
                <label class="block text-sm text-pawbby-muted mb-1">Tuya Device ID</label>
                <input v-model="editDevice.deviceId" type="text"
                  class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
              </div>
              <div>
                <label class="block text-sm text-pawbby-muted mb-1">IP Address</label>
                <input v-model="editDevice.ipAddress" type="text"
                  class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
              </div>
              <div>
                <label class="block text-sm text-pawbby-muted mb-1">Local Key</label>
                <input v-model="editDevice.localKey" type="text"
                  class="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pawbby-primary" />
              </div>
            </div>
          </details>

          <button @click="handleUpdateDevice" :disabled="isSaving"
            class="w-full py-4 bg-pawbby-primary text-black font-bold rounded-2xl hover:bg-pawbby-secondary transition-colors mt-6">
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>

          <button @click="handleDeleteDevice"
            class="w-full py-3 text-[#D84C4C] font-semibold rounded-2xl hover:bg-white/5 transition-colors">
            Delete Device
          </button>
        </div>
      </div>
    </div>

    <!-- Deodorizer Modal -->
    <div v-if="showDeodorizerModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden text-center">
        <div
          class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <rect x="7" y="10" width="10" height="10" rx="3" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 7c0-1 1.5-1.5 1.5-3m3 3c0-1 1.5-1.5 1.5-3" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Deodorizing Pod</h2>
        <p class="text-pawbby-muted text-sm mb-6">
          <span v-if="device?.deodorizerLastReset">
            Last Reset: {{ new Date(device.deodorizerLastReset).toLocaleDateString() }}
          </span>
          <span v-else>Never Reset</span>
        </p>

        <div class="space-y-3">
          <button @click="resetDeodorizer(30)" :disabled="isResettingDeodorizer"
            class="w-full py-3 bg-pawbby-primary text-black font-bold rounded-2xl hover:bg-pawbby-secondary transition-colors disabled:opacity-50">
            <span v-if="isResettingDeodorizer">Resetting...</span>
            <span v-else>Reset for 30 Days (Recommended)</span>
          </button>

          <button @click="resetDeodorizer(60)" :disabled="isResettingDeodorizer"
            class="w-full py-3 bg-white/5 text-white/90 font-semibold rounded-2xl hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50">
            Reset for 60 Days
          </button>

          <button @click="showDeodorizerModal = false"
            class="w-full py-2 text-pawbby-muted text-sm hover:text-white transition-colors mt-2">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Liability Warning Modal -->
    <div v-if="showLiabilityModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden text-center">
        <div
          class="w-16 h-16 bg-[#D84C4C]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D84C4C]/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#D84C4C]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Safety Warning</h2>
        <p class="text-pawbby-muted text-sm mb-6 leading-relaxed">
          <strong>Never initiate a manual cycle if a cat is inside or near the litter box.</strong><br /><br />
          By proceeding, you accept full responsibility for ensuring the machine is clear and safe to operate.
        </p>

        <div class="space-y-3">
          <button @click="proceedLiabilityAction"
            class="w-full py-3 bg-[#D84C4C] text-white font-bold rounded-2xl hover:bg-[#D84C4C]/80 transition-colors">
            I Understand, Proceed
          </button>
          <button @click="showLiabilityModal = false"
            class="w-full py-2 text-pawbby-muted text-sm hover:text-white transition-colors mt-2">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Empty Confirmation Modal -->
    <div v-if="showEmptyModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden text-center">
        <div
          class="w-16 h-16 bg-pawbby-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-pawbby-primary/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-pawbby-primary" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Empty Litter Box?</h2>
        <p class="text-pawbby-muted text-sm mb-6 leading-relaxed">
          This will dump <strong>all clean and dirty litter</strong> directly into the waste bin. This action cannot be
          undone and will require a full refill.
        </p>

        <div class="space-y-3">
          <button @click="proceedEmptyAction"
            class="w-full py-3 bg-pawbby-primary text-black font-bold rounded-2xl hover:bg-pawbby-secondary transition-colors">
            Yes, Empty Litter
          </button>
          <button @click="showEmptyModal = false"
            class="w-full py-2 text-pawbby-muted text-sm hover:text-white transition-colors mt-2">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Tare Confirmation Modal -->
    <div v-if="showTareModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden text-center">
        <div
          class="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Zero / Tare Scale</h2>
        <p class="text-pawbby-muted text-sm mb-6 leading-relaxed">
          Ensure the litter box is empty of cats, on a flat surface, and steady before calibrating the scale.
        </p>

        <div class="space-y-3">
          <button @click="proceedTareAction"
            class="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-colors">
            Zero Scale Now
          </button>
          <button @click="showTareModal = false"
            class="w-full py-2 text-pawbby-muted text-sm hover:text-white transition-colors mt-2">
            Cancel
          </button>
        </div>
      </div>
    </div>

      <!-- Assign Pet Modal -->
    <div v-if="showAssignPetModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden text-center">
        <h2 class="text-xl font-bold text-white mb-4">Assign to Pet</h2>
        <p class="text-pawbby-muted text-sm mb-6 leading-relaxed">
          Which cat used the litter box?
        </p>
        
        <div class="space-y-3">
          <div class="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
            <button v-for="pet in pets" :key="pet.id" @click="assignPet(pet.id!)"
              class="w-full py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 border border-white/5 transition-colors flex items-center px-4 space-x-3">
              <div class="w-8 h-8 rounded-full overflow-hidden bg-pawbby-primary/20 flex-shrink-0">
                <img v-if="pet.imageBase64" :src="pet.imageBase64" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-pawbby-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <span>{{ pet.name }}</span>
            </button>
          </div>

          <button @click="showAssignPetModal = false"
            class="w-full py-2 text-pawbby-muted text-sm hover:text-white transition-colors mt-2">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Litter Type Modal -->
    <div v-if="showLitterModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-lg border border-white/10 relative overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4 pb-3 border-b border-white/10">
          <div>
            <h3 class="text-xl font-bold text-white">Select Litter Type</h3>
            <p class="text-pawbby-muted text-xs mt-1">
              Current value: <span class="text-pawbby-primary font-semibold">{{ currentLitterName }}</span>
            </p>
          </div>
          <button @click="showLitterModal = false" class="text-white/50 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="text-xs text-white/70 mb-4">
          Tap the picture matching the cat litter you pour into your box:
        </p>

        <!-- 2x2 Visual Grid of Real Pictures -->
        <div class="grid grid-cols-2 gap-3.5 overflow-y-auto pr-1">
          <button
            v-for="litter in LITTER_CARDS"
            :key="litter.id"
            type="button"
            @click="selectLitter(litter.id)"
            :disabled="settingBusy.litter_type"
            :class="[
              effectiveSettings?.litterType === litter.id
                ? 'border-pawbby-primary bg-pawbby-primary/10 shadow-lg shadow-pawbby-primary/10 ring-2 ring-pawbby-primary'
                : 'border-white/10 bg-black/30 hover:border-white/30 hover:bg-black/40',
              settingBusy.litter_type ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              'relative rounded-2xl border p-3 text-left transition-all duration-200 flex flex-col group overflow-hidden'
            ]"
          >
            <!-- Litter Photo with Badge & Active Check -->
            <div class="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-black/40 border border-white/10">
              <img :src="litter.image" :alt="litter.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              
              <!-- Active Checkmark Overlay -->
              <div v-if="effectiveSettings?.litterType === litter.id" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-pawbby-primary flex items-center justify-center text-black shadow-lg">
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>

              <!-- Badge -->
              <span v-if="litter.badge" :class="[litter.badgeClass, 'absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md shadow']">
                {{ litter.badge }}
              </span>
            </div>

            <!-- Name & Simple Label -->
            <div class="flex items-center justify-between">
              <span class="text-white font-bold text-sm leading-tight">{{ litter.name }}</span>
              <span v-if="effectiveSettings?.litterType === litter.id" class="text-pawbby-primary text-[11px] font-semibold">Active</span>
            </div>
            <span class="text-pawbby-muted text-[11px] block mt-0.5">{{ litter.simpleLabel }}</span>
          </button>
        </div>

        <!-- Footer -->
        <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <span class="text-xs text-pawbby-mutedDark">Updates box level sensor calibration</span>
          <button @click="showLitterModal = false" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>

    <!-- Screen Lock Liability Warning Modal -->
    <div v-if="showScreenLockModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden text-center shadow-2xl">
        <div class="w-16 h-16 bg-[#D84C4C]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D84C4C]/50 text-[#D84C4C]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Screen Lock Warning</h2>
        <div class="text-pawbby-muted text-sm mb-6 leading-relaxed text-left bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
          <p class="text-white/90 font-medium">
            ⚠️ <strong>Potentially dangerous action:</strong>
          </p>
          <p class="text-xs text-white/80">
            Locking the screen disables all physical button presses on the box to prevent accidental presses by children or pets.
          </p>
          <p class="text-xs text-white/80">
            If Pawbby Reborn loses connection, your Wi-Fi changes, or the daemon goes offline while locked, you may be completely locked out from controlling or unlocking the machine from its physical controls.
          </p>
          <p class="text-[#D84C4C] text-[11px] font-semibold pt-1 border-t border-white/10">
            Pawbby Reborn and its developers take NO liability in case this locks out or bricks your machine. Proceed at your own risk.
          </p>
        </div>

        <div class="space-y-3">
          <button @click="confirmScreenLock"
            class="w-full py-3 bg-[#D84C4C] text-white font-bold rounded-2xl hover:bg-[#D84C4C]/80 transition-colors shadow-lg shadow-[#D84C4C]/20">
            I Understand the Risk, Lock Buttons
          </button>
          <button @click="showScreenLockModal = false"
            class="w-full py-2.5 text-pawbby-muted text-sm hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useApi, LITTER_TYPES, type Device, type Pet, type DeviceLog, type User, type DeviceSettings } from '~/composables/useApi'
import { Bar, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

definePageMeta({
  layout: 'detail'
})

const api = useApi()
const route = useRoute()
const router = useRouter()
const activeTab = ref('record')
const deviceId = String(route.query.id || 'dev_1')

const user = ref<User | null>(null)
const device = ref<Device | null>(null)
const pets = ref<Pet[]>([])
const logs = ref<DeviceLog[]>([])
let pollInterval: any = null

const historyData = ref<any>(null)
const historyLoading = ref(false)
const selectedChart = ref('visits')

const showSettingsModal = ref(false)
const showDeodorizerModal = ref(false)
const showLiabilityModal = ref(false)
const showEmptyModal = ref(false)
const showTareModal = ref(false)
const showAssignPetModal = ref(false)
const showLitterModal = ref(false)
const showScreenLockModal = ref(false)
const eventToAssign = ref<DeviceLog | null>(null)
const pendingAction = ref<'clean' | 'flatten'>('flatten')

const isSaving = ref(false)
const isResettingDeodorizer = ref(false)
const editDevice = ref({
  name: '',
  deviceId: '',
  ipAddress: '',
  localKey: ''
})

let initialDateSet = false

const loadData = async () => {
  const devices = await api.getDevices()
  device.value = devices.find((d: any) => d.id === deviceId) || null
  pets.value = await api.getPets()
  user.value = await api.getUser()
  
  if (!initialDateSet && user.value) {
    selectedDateFilter.value = getLocalYMD(new Date(), user.value.timezone)
    initialDateSet = true
  }

  const rawLogs = await api.getLogs(deviceId)
  const timeZone = user.value?.timezone || 'UTC'

  logs.value = rawLogs.map((log: any) => {
    let timestampStr = log.timestamp
    let localDateStr = log.localDate
    
    if (log.rawTimestamp) {
      timestampStr = formatLogTime(log.rawTimestamp, timeZone)
      localDateStr = formatLocalDate(log.rawTimestamp, timeZone)
    }
    
    return { ...log, timestamp: timestampStr, localDate: localDateStr }
  })
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await fetch(`/api/history?deviceId=${deviceId}&days=7`)
    historyData.value = await res.json()
  } catch (e) {
    console.error("Failed to load history", e)
  } finally {
    historyLoading.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'history' && !historyData.value) {
    loadHistory()
  }
})

onMounted(() => {
  loadData()
  pollInterval = setInterval(loadData, 2000)
})

const openSettings = () => {
  if (device.value) {
    editDevice.value = {
      name: device.value.name || '',
      deviceId: device.value.deviceId || '',
      ipAddress: device.value.ipAddress || '',
      localKey: device.value.localKey || ''
    }
  }
  showSettingsModal.value = true
}

const handleUpdateDevice = async () => {
  isSaving.value = true
  try {
    await api.updateDevice(deviceId, editDevice.value)
    await loadData()
    showSettingsModal.value = false
  } catch (e) {
    alert("Failed to update device")
  } finally {
    isSaving.value = false
  }
}

const handleDeleteDevice = async () => {
  if (confirm("Are you sure you want to delete this device?")) {
    await api.deleteDevice(deviceId)
    router.push('/')
  }
}

const openAssignPetModal = (log: DeviceLog) => {
  eventToAssign.value = log
  showAssignPetModal.value = true
}

const assignPet = async (petId: string) => {
  if (!eventToAssign.value) return
  
  try {
    await api.assignPetToEvent(eventToAssign.value.id, petId)
    await loadData() // reload logs to show the new assignment
  } catch (e) {
    alert("Failed to assign pet")
  } finally {
    showAssignPetModal.value = false
    eventToAssign.value = null
  }
}

const deodorizerDaysLeft = computed(() => {
  if (!device.value || !device.value.deodorizerLastReset) return 0
  const resetDate = new Date(device.value.deodorizerLastReset)
  resetDate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const duration = device.value.deodorizerDuration || 30
  const daysPassed = Math.floor((today.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, duration - daysPassed)
})

const isOnline = computed(() => {
  if (!device.value?.lastHeartbeat) return false
  const hb = new Date(device.value.lastHeartbeat).getTime()
  const now = Date.now()
  // Devices actively ping every 5 mins, allow 7 mins before offline
  return (now - hb) < 420000
})

const resetDeodorizer = async (duration: number) => {
  isResettingDeodorizer.value = true
  try {
    await api.updateDevice(deviceId, {
      deodorizerLastReset: new Date().toISOString(),
      deodorizerDuration: duration
    })
    await api.createEvent({
      deviceId,
      type: 'reset-deodorizer',
      rawData: JSON.stringify({ duration })
    })
    await loadData()
    showDeodorizerModal.value = false
  } catch (e) {
    alert("Failed to reset deodorizer")
  } finally {
    isResettingDeodorizer.value = false
  }
}

const getPetInfo = (id?: string) => {
  return pets.value.find(p => p.id === id)
}

const getPetLogCount = (petId: string) => {
  return logs.value.filter(l => {
    if (l.petId !== petId) return false
    if (l.type !== 'toileted' && l.type !== 'quick-visit') return false
    if (selectedDateFilter.value && l.localDate !== selectedDateFilter.value) return false
    return true
  }).length
}

const getAllLogCount = computed(() => {
  return logs.value.filter(l => {
    if (l.type !== 'toileted' && l.type !== 'quick-visit') return false
    if (selectedDateFilter.value && l.localDate !== selectedDateFilter.value) return false
    return true
  }).length
})



// Filtering
const selectedPetFilter = ref('all')
const selectedDateFilter = ref(getLocalYMD(new Date()))

const maxDate = computed(() => {
  return getLocalYMD(new Date(), user.value?.timezone)
})

const minDate = computed(() => {
  if (logs.value && logs.value.length > 0) {
    // The logs are ordered by timestamp descending, so the last log is the oldest
    const oldestLog = logs.value[logs.value.length - 1]
    if (oldestLog && oldestLog.localDate) {
      return oldestLog.localDate
    }
  }
  return maxDate.value
})

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    // Pet filter logic
    if (selectedPetFilter.value !== 'all') {
      if (log.petId !== selectedPetFilter.value) return false
    }

    // Date filter logic
    if (selectedDateFilter.value) {
      if (log.localDate !== selectedDateFilter.value) {
        return false
      }
    }

    // User Preferences (Dashboard Visibility)
    if (user.value) {
      if ((log.type === 'toileted' || log.type === 'quick-visit') && !user.value.notifyDashVisit) return false;
      if (log.type === 'auto-clean' && !user.value.notifyDashAutoClean) return false;
      if ((log.type === 'manual-clean' || log.type === 'manual-clean-app') && !user.value.notifyDashManualClean) return false;
      if ((log.type === 'empty' || log.type === 'empty-app') && !user.value.notifyDashEmpty) return false;
      if ((log.type === 'flatten' || log.type === 'flatten-app' || log.type === 'auto-flatten') && !user.value.notifyDashFlatten) return false;
      if ((log.type === 'lid-removed' || log.type === 'lid-replaced' || log.type === 'bin-removed' || log.type === 'bin-replaced' || log.type === 'drum-removed' || log.type === 'drum-installed' || log.type === 'litter-low' || log.type === 'litter-sufficient') && !user.value.notifyDashError) return false;
    }

    return true
  })
})

const isBusy = computed(() => {
  return (device.value?.status && device.value.status !== 'Ready') || device.value?.lidOpen || device.value?.binRemoved
})

const confirmClean = () => {
  pendingAction.value = 'clean'
  showLiabilityModal.value = true
}

const confirmFlatten = () => {
  pendingAction.value = 'flatten'
  showLiabilityModal.value = true
}

const proceedLiabilityAction = () => {
  showLiabilityModal.value = false
  if (pendingAction.value === 'clean') {
    doClean()
  } else {
    doFlatten()
  }
}

const confirmEmpty = () => {
  showEmptyModal.value = true
}

const proceedEmptyAction = () => {
  showEmptyModal.value = false
  doEmpty()
}

const confirmTare = () => {
  showTareModal.value = true
}

const proceedTareAction = () => {
  showTareModal.value = false
  doTare()
}

const doTare = async () => {
  await api.triggerTare(deviceId)
  setTimeout(loadData, 2000)
}

const currentChartData = computed(() => {
  if (!historyData.value) return null
  return {
    labels: historyData.value.labels,
    datasets: historyData.value.charts[selectedChart.value] || []
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#9CA3AF',
        usePointStyle: true,
        padding: 20
      }
    }
  },
  scales: {
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { color: '#9CA3AF' }
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
      ticks: { color: '#9CA3AF' },
      beginAtZero: true
    }
  }
}

const doClean = async () => {
  await api.triggerClean(deviceId)
  activeTab.value = 'record'
  setTimeout(loadData, 2000)
  setTimeout(loadData, 5000)
}

const doFlatten = async () => {
  await api.triggerFlatten(deviceId)
  activeTab.value = 'record'
  setTimeout(loadData, 2000)
  setTimeout(loadData, 5000)
}

const doEmpty = async () => {
  await api.triggerEmpty(deviceId)
  activeTab.value = 'record'
  setTimeout(loadData, 2000)
  setTimeout(loadData, 5000)
}

/* ------------------------------------------------------------------ */
/* Hardware settings (DP 105 writes, DP 103 read-back)                 */
/* ------------------------------------------------------------------ */

type ToggleKey = 'auto_clean' | 'soft_clumps' | 'sleep_mode' | 'auto_off_screen' | 'child_lock'
type SettingKey = ToggleKey | 'auto_clean_delay' | 'sleep_window' | 'litter_type' | 'reset_deodorant' | 'refresh'

const svgIcon = (path: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${path}" /></svg>`

const settingToggles: { key: ToggleKey; field: keyof DeviceSettings; title: string; hint: string; color: string; icon: string }[] = [
  {
    key: 'auto_clean', field: 'autoClean', title: 'Auto-clean', color: 'bg-[#3D7A41]',
    hint: 'Clean automatically after each visit',
    icon: svgIcon('M5 13l4 4L19 7'),
  },
  {
    key: 'soft_clumps', field: 'softClumps', title: 'Soft Clumps Mode', color: 'bg-[#2A6372]',
    hint: 'Shake the drum 2–4 times before cleaning to bury soft stool',
    icon: svgIcon('M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'),
  },
  {
    key: 'auto_off_screen', field: 'autoOffScreen', title: 'Auto screen-off', color: 'bg-pawbby-brown',
    hint: 'Turn the screen off after 5 minutes idle',
    icon: svgIcon('M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'),
  },
  {
    key: 'child_lock', field: 'childLock', title: 'Screen lock', color: 'bg-pawbby-brown',
    hint: 'Lock the buttons on the box to prevent accidental presses',
    icon: svgIcon('M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'),
  },
]

const LITTER_CARDS = [
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

const settingBusy = ref<Record<string, boolean>>({})
const settingError = ref('')
// Optimistic overrides until the box pushes a newer DP 103 snapshot
const pendingSettings = ref<Record<string, { value: any; at: number }>>({})

const effectiveSettings = computed<DeviceSettings | null>(() => {
  const base = device.value?.settings
  if (!base) return null
  const reportedAt = device.value?.settingsUpdatedAt ? new Date(device.value.settingsUpdatedAt).getTime() : 0
  const merged: DeviceSettings = { ...base }
  for (const [field, p] of Object.entries(pendingSettings.value)) {
    // Keep the optimistic value for up to 60s or until the device reports something newer
    if (p.at > reportedAt && Date.now() - p.at < 60000) {
      ;(merged as any)[field] = p.value
    }
  }
  return merged
})

const selectedLitter = computed(() => {
  if (!effectiveSettings.value) return null
  return LITTER_CARDS.find(c => c.id === effectiveSettings.value?.litterType) || null
})

const currentLitterName = computed(() => {
  const id = effectiveSettings.value?.litterType
  const found = LITTER_CARDS.find(c => c.id === id)
  if (found) return found.name
  if (id !== undefined) return `Type ${id}`
  return 'Select litter'
})

const selectLitter = (id: number) => {
  setLitterType(id)
}

const settingsAge = computed(() => {
  const at = device.value?.settingsUpdatedAt
  if (!at) return 'never'
  const secs = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 1000))
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.round(secs / 60)} min ago`
  return `${Math.round(secs / 3600)} h ago`
})

const sleepForm = ref({ start: '22:00', stop: '08:30' })
let sleepFormSeeded = false
watch(effectiveSettings, (s) => {
  if (s && !sleepFormSeeded) {
    sleepForm.value = { start: s.sleepStart, stop: s.sleepStop }
    sleepFormSeeded = true
  }
}, { immediate: true })

const sleepWindowDirty = computed(() => {
  const s = effectiveSettings.value
  if (!s) return false
  return sleepForm.value.start !== s.sleepStart || sleepForm.value.stop !== s.sleepStop
})

const sleepWindowHours = computed(() => {
  const m = (t: string) => {
    const [h, mm] = t.split(':').map(Number)
    return (h ?? 0) * 60 + (mm ?? 0)
  }
  if (!sleepForm.value.start || !sleepForm.value.stop) return null
  let diff = m(sleepForm.value.stop) - m(sleepForm.value.start)
  if (diff <= 0) diff += 24 * 60
  return diff / 60
})

const applySetting = async (key: SettingKey, value: any, optimistic?: Partial<DeviceSettings>) => {
  settingBusy.value = { ...settingBusy.value, [key]: true }
  settingError.value = ''
  try {
    await api.updateDeviceSetting(deviceId, key, value)
    if (optimistic) {
      const now = Date.now()
      const next = { ...pendingSettings.value }
      for (const [f, v] of Object.entries(optimistic)) next[f] = { value: v, at: now }
      pendingSettings.value = next
    }
    setTimeout(loadData, 1500)
    setTimeout(loadData, 4000)
  } catch (e: any) {
    settingError.value = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Failed to update setting'
  } finally {
    settingBusy.value = { ...settingBusy.value, [key]: false }
  }
}

const confirmScreenLock = () => {
  showScreenLockModal.value = false
  applySetting('child_lock', true, { childLock: true })
}

const setToggle = (key: ToggleKey, field: keyof DeviceSettings) => {
  const s = effectiveSettings.value
  if (!s) return
  const next = !s[field]

  if (key === 'child_lock' && next === true) {
    showScreenLockModal.value = true
    return
  }

  applySetting(key, next, { [field]: next } as Partial<DeviceSettings>)
}

const setDelay = (val: string) => {
  const minutes = Number(val)
  if (!minutes) return
  applySetting('auto_clean_delay', minutes, { autoCleanDelayMin: minutes })
}

const setLitterType = (val: string | number) => {
  const id = Number(val)
  if (!Number.isInteger(id)) return
  applySetting('litter_type', id, { litterType: id })
}

const saveSleepWindow = () => {
  const { start, stop } = sleepForm.value
  if (!start || !stop) return
  applySetting('sleep_window', { start, stop }, { sleepStart: start, sleepStop: stop })
}

// DP 103 is pushed by the box on every change and every ~10 min, so the cached
// snapshot is normally current. Only when nothing is cached yet (fresh install) do we
// ask the daemon, which then pushes the account time zone to trigger a first snapshot.
// Done whenever the Settings tab is opened.
let lastSettingsRefresh = 0
const refreshSettings = async () => {
  if (settingBusy.value.refresh) return
  if (Date.now() - lastSettingsRefresh < 5000) return
  if (device.value?.settings) return
  lastSettingsRefresh = Date.now()
  settingBusy.value = { ...settingBusy.value, refresh: true }
  try {
    await api.updateDeviceSetting(deviceId, 'refresh')
    setTimeout(loadData, 1500)
    setTimeout(loadData, 4000)
  } catch (e: any) {
    settingError.value = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Could not reach the device'
  } finally {
    setTimeout(() => {
      settingBusy.value = { ...settingBusy.value, refresh: false }
    }, 4000)
  }
}

watch(activeTab, (tab) => {
  if (tab === 'settings') refreshSettings()
})
watch(() => device.value?.id, (id) => {
  if (id && activeTab.value === 'settings') refreshSettings()
})

// Hidden in the UI: Pawbby Reborn keeps its own pod counter (see the deodorizer modal).
// Flip to true to expose the firmware's 60-day counter + reset in the Device Settings card.
const SHOW_DEVICE_DEODORANT_RESET = false

const resetDeviceDeodorant = () => {
  if (!confirm('Reset the deodorizing pod counter on the litter box? Do this after inserting a new pod.')) return
  applySetting('reset_deodorant', undefined, { deodorantDays: 60 })
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

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
