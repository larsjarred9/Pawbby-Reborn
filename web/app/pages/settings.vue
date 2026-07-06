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

      <!-- Timezone -->
      <button @click="showTimezoneModal = true" class="w-full flex items-center justify-between text-white/90 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium text-lg">Timezone</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors max-w-[120px] truncate text-right">{{ user?.timezone || 'UTC' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Notification Controls -->
      <button @click="showNotificationControlsModal = true" class="w-full flex items-center justify-between text-white/90 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="font-medium text-lg">Notification Controls</span>
        </div>
        <div class="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Push Notifications -->
      <button @click="showNotificationsModal = true"
        class="w-full flex items-center justify-between text-white/90 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="font-medium text-lg">Push Notifications</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors">{{ webhookUrl ?
            'Configured' : 'Setup' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- External API -->
      <button @click="showApiModal = true" class="w-full flex items-center justify-between text-white/90 hover:text-white group">
        <div class="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pawbby-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="font-medium text-lg">External API</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors">{{ user?.apiKey ? 'Configured' : 'Setup' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pawbby-mutedDark group-hover:text-pawbby-muted transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Check for Updates -->
      <button @click="handleUpdateClick"
        class="w-full flex items-center justify-between text-white/90 hover:text-white group">
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

    <!-- Export Anonymized DB -->
    <button @click="showExportModal = true"
      class="mt-8 block w-full text-left border border-[#3D7A41]/20 bg-[#3D7A41]/5 rounded-2xl p-4 hover:bg-[#3D7A41]/10 transition-colors group cursor-pointer">
      <div class="flex items-center justify-between text-white/90 group-hover:text-white mb-2">
        <div class="flex items-center space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#3D7A41]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span class="font-medium text-lg">Export Anonymized DB</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-[#3D7A41]/50 group-hover:text-[#3D7A41] transition-colors" viewBox="0 0 20 20"
          fill="currentColor">
          <path fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd" />
        </svg>
      </div>
      <p class="text-xs text-pawbby-mutedDark ml-9">
        Downloads a safe, redacted copy of your database to share with developers.
      </p>
    </button>
    <!-- Account Actions -->
    <div class="mt-auto pt-8 pb-4 space-y-4">
      <button @click="doLogout"
        class="w-full text-center py-4 bg-white/5 text-white font-semibold text-lg hover:bg-white/10 rounded-2xl transition-colors">
        Log Out
      </button>
      <button @click="doClearCache"
        class="w-full text-center py-4 text-[#D84C4C] font-semibold text-lg hover:bg-white/5 rounded-2xl transition-colors">
        Remove stored information
      </button>
    </div>

    <!-- Export DB Modal -->
    <div v-if="showExportModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden">
        <div
          class="w-16 h-16 bg-[#3D7A41]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3D7A41]/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#3D7A41]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2 text-center">Export Database</h2>
        <p class="text-pawbby-muted text-sm mb-6 text-center leading-relaxed">
          This will securely download an anonymized copy of your database. All Wi-Fi passwords, Tuya keys, IPs, and
          names have been permanently erased.<br><br>
          Once downloaded, join our <a href="https://discord.gg/Tw43AKZkge" target="_blank"
            class="text-[#5865F2] font-bold hover:underline">Discord Server</a> and drag-and-drop the file into the
          <strong>#database-dump</strong> channel to help us find new features!
        </p>
        <div class="flex gap-3">
          <button @click="showExportModal = false"
            class="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <a href="/api/export-anonymized-db" download="pawbby-share.db" @click="showExportModal = false"
            class="w-full flex items-center justify-center py-4 bg-[#3D7A41]/80 text-white font-bold rounded-2xl hover:bg-[#3D7A41] transition-colors">
            Download
          </a>
        </div>
      </div>
    </div>

    <!-- Upgrade Instructions Modal -->
    <div v-if="showUpgradeModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden">
        <div
          class="w-16 h-16 bg-[#3D7A41]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3D7A41]/50">
          <svg v-if="isUpdating" class="animate-spin h-8 w-8 text-[#3D7A41]" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#3D7A41]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2 text-center">{{ isUpdating ? 'Updating...' : 'Update Available!' }}
        </h2>
        <p class="text-pawbby-muted text-sm mb-6 text-center">
          <span v-if="isUpdating">Pawbby Reborn is currently updating. This usually takes 1-2 minutes. The page will
            automatically refresh when complete.</span>
          <span v-else-if="updatesDisabled">A new version of the dashboard is available! However, automatic updates are
            disabled in your environment. Please run the upgrade commands manually. <br><br><a
              href="https://github.com/larsjarred9/Pawbby-Reborn/#-updating-to-the-latest-version" target="_blank"
              class="text-white hover:text-white/80 underline font-bold transition-colors">View Upgrade
              Instructions</a></span>
          <span v-else>A new version of the dashboard is available! Would you like to automatically download and install
            it now?</span>
        </p>
        <div v-if="!isUpdating" class="flex gap-3">
          <button @click="showUpgradeModal = false"
            class="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">
            {{ updatesDisabled ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="!updatesDisabled" @click="triggerUpdate"
            class="w-full py-4 bg-[#3D7A41]/80 text-white font-bold rounded-2xl hover:bg-[#3D7A41] transition-colors">
            Confirm & Update
          </button>
        </div>
      </div>
    </div>

    <!-- Push Notifications Modal -->
    <div v-if="showNotificationsModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden animate-fade-in-up">
        <h3 class="text-xl font-bold text-white mb-2">Push Notifications</h3>
        <p class="text-xs text-pawbby-muted mb-6">Receive an instant alert via Discord or Slack when your cat uses the
          litter box.</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-pawbby-muted mb-1">Webhook URL</label>
            <input v-model="webhookUrl" @change="saveWebhookUrl" type="url"
              placeholder="Paste Discord or Slack Webhook URL..."
              class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pawbby-primary" />
          </div>

          <button @click="testWebhook" :disabled="testingWebhook || !webhookUrl"
            class="w-full py-3 bg-pawbby-primary/10 text-[#3D7A41] font-semibold rounded-xl hover:bg-pawbby-primary/20 transition-colors disabled:opacity-50 text-sm">
            {{ testingWebhook ? 'Testing...' : 'Test Notification' }}
          </button>
        </div>
        <div class="mt-6">
          <button @click="showNotificationsModal = false"
            class="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Timezone Modal -->
    <div v-if="showTimezoneModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden animate-fade-in-up">
        <h3 class="text-xl font-bold text-white mb-2">Timezone</h3>
        <p class="text-xs text-pawbby-muted mb-6">Select your local timezone.</p>
        <div class="space-y-4">
          <div>
            <select v-model="selectedTimezone" @change="saveTimezone"
              class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pawbby-primary">
              <option v-for="tz in availableTimezones" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>
        </div>
        <div class="mt-6">
          <button @click="showTimezoneModal = false"
            class="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Controls Modal -->
    <div v-if="showNotificationControlsModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
        <h3 class="text-xl font-bold text-white mb-2">Notification Controls</h3>
        <p class="text-xs text-pawbby-muted mb-6">Configure which events trigger webhooks and what shows on your timeline.</p>
        
        <div class="space-y-6">
          <!-- Webhook Settings -->
          <div v-if="webhookUrl">
            <h4 class="text-sm font-semibold text-white/90 mb-3 border-b border-white/10 pb-2">Push Notifications (Webhook)</h4>
            <div class="space-y-4">
              <div v-if="user" class="space-y-2">
                <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                  <span>Cat Usage</span>
                  <input type="checkbox" v-model="user.notifyPushVisit" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
                </label>
                <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                  <span>Auto Clean</span>
                  <input type="checkbox" v-model="user.notifyPushAutoClean" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
                </label>
                <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                  <span>Manual Clean</span>
                  <input type="checkbox" v-model="user.notifyPushManualClean" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
                </label>
                <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                  <span>Empty Bin</span>
                  <input type="checkbox" v-model="user.notifyPushEmpty" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
                </label>
                <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                  <span>Flatten Litter</span>
                  <input type="checkbox" v-model="user.notifyPushFlatten" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
                </label>
                <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                  <span>Hardware Alerts</span>
                  <input type="checkbox" v-model="user.notifyPushError" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
                </label>
              </div>
            </div>
          </div>

          <!-- Dashboard History Settings -->
          <div>
            <h4 class="text-sm font-semibold text-white/90 mb-3 border-b border-white/10 pb-2">Dashboard Timeline</h4>
            <div v-if="user" class="space-y-2">
              <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                <span>Cat Usage</span>
                <input type="checkbox" v-model="user.notifyDashVisit" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
              </label>
              <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                <span>Auto Clean</span>
                <input type="checkbox" v-model="user.notifyDashAutoClean" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
              </label>
              <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                <span>Manual Clean</span>
                <input type="checkbox" v-model="user.notifyDashManualClean" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
              </label>
              <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                <span>Empty Bin</span>
                <input type="checkbox" v-model="user.notifyDashEmpty" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
              </label>
              <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                <span>Flatten Litter</span>
                <input type="checkbox" v-model="user.notifyDashFlatten" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
              </label>
              <label class="flex items-center justify-between text-sm text-white/80 cursor-pointer">
                <span>Hardware Alerts</span>
                <input type="checkbox" v-model="user.notifyDashError" @change="saveNotificationSettings" class="accent-pawbby-primary w-4 h-4 rounded" />
              </label>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <button @click="showNotificationControlsModal = false" class="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- External API Modal -->
    <div v-if="showApiModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl p-6 w-full max-w-sm border border-white/10 relative overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto no-scrollbar">
        <h3 class="text-xl font-bold text-white mb-2">External API</h3>
        <p class="text-xs text-pawbby-muted mb-6">Generate an API key to control Pawbby from external apps.</p>
        <div class="space-y-4">
          <div v-if="user?.apiKey">
            <label class="block text-sm text-pawbby-muted mb-1">Your API Key</label>
            <div class="flex gap-2">
              <input :type="showApiKey ? 'text' : 'password'" readonly :value="user.apiKey" class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
              <button @click="showApiKey = !showApiKey" class="px-3 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-colors">
                <svg v-if="!showApiKey" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
              </button>
              <button @click="copyApiKey" class="px-3 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-colors" title="Copy API Key">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
          <button @click="doGenerateApiKey" :disabled="generatingKey" class="w-full py-3 bg-pawbby-primary/10 text-[#3D7A41] font-semibold rounded-xl hover:bg-pawbby-primary/20 transition-colors disabled:opacity-50 text-sm">
            {{ generatingKey ? 'Generating...' : (user?.apiKey ? 'Regenerate API Key' : 'Generate API Key') }}
          </button>
          
          <NuxtLink to="/api-docs" class="block text-center text-[#5865F2] hover:underline text-sm font-bold pt-2">
            View API Documentation
          </NuxtLink>
        </div>
        <div class="mt-6">
          <button @click="showApiModal = false" class="w-full py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
            Close
          </button>
        </div>
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
const updatesDisabled = ref(false)
const showUpgradeModal = ref(false)
const isUpdating = ref(false)
const showExportModal = ref(false)

const showApiModal = ref(false)
const showApiKey = ref(false)
const generatingKey = ref(false)

const doGenerateApiKey = async () => {
  if (user.value?.apiKey && !confirm('Are you sure you want to regenerate your API key? Any existing apps using the old key will stop working.')) {
    return
  }
  generatingKey.value = true
  try {
    const newKey = await api.generateApiKey()
    if (user.value) {
      user.value.apiKey = newKey
      showApiKey.value = true
    }
  } catch (e) {
    alert('Failed to generate API key.')
  } finally {
    generatingKey.value = false
  }
}

const copyApiKey = async () => {
  if (user.value?.apiKey) {
    try {
      await navigator.clipboard.writeText(user.value.apiKey)
      alert('API Key copied to clipboard!')
    } catch (e) {
      alert('Failed to copy to clipboard.')
    }
  }
}

const handleUpdateClick = () => {
  if (updateAvailable.value) {
    showUpgradeModal.value = true
  } else {
    checkForUpdates()
  }
}

const doLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  } catch (e) {
    console.error(e)
  }
}

const triggerUpdate = async () => {
  isUpdating.value = true
  try {
    await fetch('/api/update', { method: 'POST' })
    pollForServer()
  } catch (e) {
    pollForServer()
  }
}

const pollForServer = () => {
  setTimeout(() => {
    const interval = setInterval(async () => {
      try {
        // Poll the root route with a lightweight HEAD request instead of the update API
        // to prevent hammering the GitHub API and triggering rate limits while the server restarts.
        const res = await fetch('/', { method: 'HEAD' })
        if (res.ok) {
          clearInterval(interval)
          window.location.reload()
        }
      } catch (e) {
        // Still offline, waiting
      }
    }, 3000)
  }, 10000)
}

const checkForUpdates = async (silent = false) => {
  if (!silent) checking.value = true
  hasChecked.value = true
  try {
    const res = await fetch('/api/update')
    const data = await res.json()
    if (data.disabled) {
      updatesDisabled.value = true
    }
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

const webhookUrl = ref('')
const testingWebhook = ref(false)
const showNotificationsModal = ref(false)
const showNotificationControlsModal = ref(false)
const showTimezoneModal = ref(false)
const selectedTimezone = ref('UTC')
const availableTimezones = ref(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['UTC'])

const loadData = async () => {
  user.value = await api.getUser()
  if (user.value.webhookUrl) {
    webhookUrl.value = user.value.webhookUrl
  }
  if (user.value.timezone) {
    selectedTimezone.value = user.value.timezone
  } else if (Intl.DateTimeFormat) {
    selectedTimezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    saveTimezone()
  }
}

const saveTimezone = async () => {
  if (!user.value) return
  await api.updateUser({ timezone: selectedTimezone.value })
  await loadData()
}

const saveWebhookUrl = async () => {
  if (!user.value) return
  await api.updateUser({ webhookUrl: webhookUrl.value })
}

const saveNotificationSettings = async () => {
  if (!user.value) return
  await api.updateUser({
    notifyPushVisit: user.value.notifyPushVisit,
    notifyPushAutoClean: user.value.notifyPushAutoClean,
    notifyPushManualClean: user.value.notifyPushManualClean,
    notifyPushEmpty: user.value.notifyPushEmpty,
    notifyPushFlatten: user.value.notifyPushFlatten,
    notifyPushError: user.value.notifyPushError,
    notifyDashVisit: user.value.notifyDashVisit,
    notifyDashAutoClean: user.value.notifyDashAutoClean,
    notifyDashManualClean: user.value.notifyDashManualClean,
    notifyDashEmpty: user.value.notifyDashEmpty,
    notifyDashFlatten: user.value.notifyDashFlatten,
    notifyDashError: user.value.notifyDashError
  })
}

const testWebhook = async () => {
  if (!webhookUrl.value) return
  testingWebhook.value = true
  try {
    const res = await fetch('/api/webhook/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: webhookUrl.value })
    })
    if (!res.ok) throw new Error('Test failed')
    alert('Test notification sent successfully!')
  } catch (e) {
    alert('Failed to send test notification. Check the URL.')
  } finally {
    testingWebhook.value = false
  }
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
