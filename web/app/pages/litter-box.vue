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
      <button @click="openSettings" class="text-white p-2 hover:text-white/80 transition-colors">
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
      <div @click="showDeodorizerModal = true"
        class="bg-pawbby-card rounded-xl p-3 flex flex-col items-center justify-center space-y-2 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
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

          <div v-for="log in filteredLogs" :key="log.id" class="flex space-x-4">
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
            <div>
              <p class="text-white/90 text-base leading-snug">{{ log.description }}</p>
              <p class="text-pawbby-mutedDark text-xs mt-1">{{ log.timestamp }}</p>
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
          <button @click="confirmClean" disabled
            class="bg-pawbby-card border border-white/10 p-5 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
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
                <p class="text-pawbby-muted text-sm mt-1">Temporarily disabled</p>
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useApi, type Device, type Pet, type DeviceLog, type User } from '~/composables/useApi'
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
const pendingAction = ref<'clean' | 'flatten'>('flatten')

const isSaving = ref(false)
const isResettingDeodorizer = ref(false)
const editDevice = ref({
  name: '',
  deviceId: '',
  ipAddress: '',
  localKey: ''
})

const loadData = async () => {
  const devices = await api.getDevices()
  device.value = devices.find((d: any) => d.id === deviceId) || null
  pets.value = await api.getPets()
  user.value = await api.getUser()
  logs.value = await api.getLogs(deviceId)
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
    if (selectedDateFilter.value && (!l.rawTimestamp || !l.rawTimestamp.startsWith(selectedDateFilter.value))) return false
    return true
  }).length
}

const getAllLogCount = computed(() => {
  return logs.value.filter(l => {
    if (l.type !== 'toileted' && l.type !== 'quick-visit') return false
    if (selectedDateFilter.value && (!l.rawTimestamp || !l.rawTimestamp.startsWith(selectedDateFilter.value))) return false
    return true
  }).length
})

// Filtering
const selectedPetFilter = ref('all')
const selectedDateFilter = ref(new Date().toISOString().split('T')[0])

const maxDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const minDate = computed(() => {
  if (logs.value && logs.value.length > 0) {
    // The logs are ordered by timestamp descending, so the last log is the oldest
    const oldestLog = logs.value[logs.value.length - 1]
    if (oldestLog && oldestLog.rawTimestamp) {
      return oldestLog.rawTimestamp.split('T')[0]
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
      if (!log.rawTimestamp || !log.rawTimestamp.startsWith(selectedDateFilter.value)) {
        return false
      }
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
