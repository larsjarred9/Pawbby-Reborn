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

      <!-- Update Banner -->
      <div v-if="showUpdateBanner" class="bg-[#3D7A41]/10 border border-[#3D7A41]/20 rounded-2xl p-4 flex items-center justify-between mb-2">
        <div class="flex items-center space-x-3">
          <div class="bg-[#3D7A41]/20 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#3D7A41]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h3 class="text-[#3D7A41] font-semibold text-sm">Update Available</h3>
            <p class="text-xs text-[#3D7A41]/80 mt-0.5">A new version is ready to install.</p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <button @click="dismissUpdateBanner" class="text-xs text-[#3D7A41]/60 hover:text-[#3D7A41]">Dismiss</button>
          <NuxtLink to="/settings" class="text-xs font-bold bg-[#3D7A41]/80 text-white px-3 py-1.5 rounded-lg hover:bg-[#3D7A41] transition-colors">
            View
          </NuxtLink>
        </div>
      </div>

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

    <!-- Setup Wizard Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-pawbby-card rounded-3xl w-full max-w-xl border border-white/10 relative overflow-hidden shadow-2xl animate-fade-in-up">
        
        <!-- Progress Bar -->
        <div class="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div class="h-full bg-gradient-to-r from-[#3D7A41] to-[#5BC266] transition-all duration-500"
               :style="{ width: (currentStep / 7) * 100 + '%' }"></div>
        </div>

        <div class="p-8">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-bold text-white tracking-tight">
              <span v-if="currentStep === 1">Say Hello 👋</span>
              <span v-if="currentStep === 2">Get the App 📱</span>
              <span v-if="currentStep === 3">Pairing Mode 🔄</span>
              <span v-if="currentStep === 4">Add to Network 🌐</span>
              <span v-if="currentStep === 5">Find the Box 🔍</span>
              <span v-if="currentStep === 6">The Secret Handshake 🤝</span>
              <span v-if="currentStep === 7">All Done! 🎉</span>
            </h2>
            <button @click="closeModal" class="text-white/40 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- STEP 1: Name -->
          <div v-if="currentStep === 1" class="space-y-6">
            <p class="text-pawbby-muted text-sm leading-relaxed">
              Let's get your smart litter box connected! First, what should we call it?
            </p>
            <div>
              <input v-model="newDevice.name" type="text" placeholder="e.g. Living Room Box"
                class="w-full bg-black/30 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white focus:outline-none focus:border-pawbby-primary transition-colors placeholder:text-white/20" />
            </div>
            
            <button @click="nextStep" :disabled="!newDevice.name"
              class="w-full py-4 bg-[#3D7A41] text-white font-bold rounded-2xl hover:bg-[#3D7A41]/80 transition-colors disabled:opacity-30 mt-4">
              Continue
            </button>
          </div>

          <!-- STEP 2: Get the App -->
          <div v-if="currentStep === 2" class="space-y-6">
            <p class="text-pawbby-muted text-sm leading-relaxed">
              If you just unboxed your Pawbby, you'll need to set it up first. Since the manufacturer's original app is dead, and the litter box is powered by Tuya under the hood, you should download the official <strong>Smart Life</strong> app.
            </p>

            <div class="flex gap-3">
              <a href="https://apps.apple.com/app/smart-life-smart-living/id1115101477" target="_blank" class="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-center hover:bg-white/10 transition-colors">
                <span class="text-xs font-bold text-white block"> App Store</span>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.tuya.smartlife" target="_blank" class="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-center hover:bg-white/10 transition-colors">
                <span class="text-xs font-bold text-white block">▶ Google Play</span>
              </a>
            </div>

            <div class="flex gap-3 pt-4">
              <button @click="currentStep--" class="px-6 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">
                Back
              </button>
              <button @click="nextStep"
                class="flex-1 py-4 bg-[#3D7A41] text-white font-bold rounded-2xl hover:bg-[#3D7A41]/80 transition-colors">
                I have the app
              </button>
            </div>
          </div>

          <!-- STEP 3: Pairing Mode -->
          <div v-if="currentStep === 3" class="space-y-6">
            <p class="text-pawbby-muted text-sm leading-relaxed">
              Next, let's put the litter box into WiFi pairing mode so the Smart Life app can find it.
            </p>

            <div class="bg-black/30 border border-white/10 rounded-xl p-4">
              <ol class="text-sm text-white/80 leading-relaxed space-y-4 list-decimal list-inside">
                <li>On the physical litter box, press the <strong>circle icon</strong> multiple times <svg class="inline-block w-6 h-6 mx-1 align-bottom text-white/70 bg-white/10 rounded-full p-1 border border-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" /></svg> until the screen says "Connect to WiFi".</li>
                <li>Press the <strong>checkmark icon</strong> <svg class="inline-block w-6 h-6 mx-1 align-bottom text-white/70 bg-white/10 rounded-full p-1 border border-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> to confirm.</li>
                <li>The WiFi icon on the screen should now be rapidly blinking.</li>
              </ol>
            </div>

            <div class="flex gap-3 pt-4">
              <button @click="currentStep--" class="px-6 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">
                Back
              </button>
              <button @click="nextStep"
                class="flex-1 py-4 bg-[#3D7A41] text-white font-bold rounded-2xl hover:bg-[#3D7A41]/80 transition-colors">
                It's blinking!
              </button>
            </div>
          </div>

          <!-- STEP 4: Add to App -->
          <div v-if="currentStep === 4" class="space-y-6">
            <p class="text-pawbby-muted text-sm leading-relaxed">
              Now that the box is blinking, open the Smart Life app on your phone and add the device to your home WiFi network.
            </p>
            
            <div class="bg-black/30 border border-white/10 rounded-xl p-4">
              <h4 class="text-xs font-bold text-[#3D7A41] uppercase tracking-wider mb-2">How to add in Smart Life</h4>
              <ol class="text-xs text-white/80 leading-relaxed space-y-2 list-decimal list-inside">
                <li>Open the <strong>Smart Life</strong> app.</li>
                <li>Tap the <strong>+ icon</strong> in the top right corner and select <strong>Add Device</strong>.</li>
                <li>The app should automatically discover the blinking litter box via Bluetooth. Follow the prompts to enter your WiFi password.</li>
              </ol>
            </div>

            <div class="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3">
              <div class="text-xl mt-0.5">ℹ️</div>
              <p class="text-xs text-white/70 leading-relaxed">
                <strong>Don't panic if the Smart Life app looks empty!</strong> The manufacturer never built a user interface for it there, so it won't actually let you control the box. Once it's on your WiFi, Pawbby Reborn takes over as the translation layer to bring it all back to life.
              </p>
            </div>
            
            <div class="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-4 flex items-start space-x-3 mt-4">
              <input type="checkbox" v-model="hasSmartLife" id="smartlife" class="mt-1 w-4 h-4 rounded border-white/20 bg-black/30 text-blue-400 focus:ring-blue-400" />
              <label for="smartlife" class="text-xs text-blue-200 cursor-pointer select-none leading-relaxed">
                <span class="font-bold text-blue-400 block mb-0.5">Prerequisite Check</span>
                I have successfully connected the litter box to my WiFi network using the Smart Life app.
              </label>
            </div>

            <div class="flex gap-3 pt-4">
              <button @click="currentStep--" class="px-6 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">
                Back
              </button>
              <button @click="nextStep" :disabled="!hasSmartLife"
                class="flex-1 py-4 bg-[#3D7A41] text-white font-bold rounded-2xl hover:bg-[#3D7A41]/80 transition-colors disabled:opacity-30">
                Continue
              </button>
            </div>
          </div>

          <!-- STEP 5: Network Scan -->
          <div v-if="currentStep === 5" class="space-y-6">
            <p class="text-pawbby-muted text-sm leading-relaxed">
              Let's find the litter box on your local WiFi network.
            </p>
            
            <div v-if="isScanning" class="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <svg class="animate-spin h-8 w-8 text-[#3D7A41]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-white font-bold animate-pulse">Snooping your network...</p>
              <p class="text-xs text-pawbby-muted">Looking for Tuya smart devices nearby</p>
            </div>

            <div v-else-if="!manualMode">
              <div v-if="discoveredDevices.length > 0" class="space-y-3">
                <div class="bg-white/5 p-3 rounded-xl border border-white/10 mb-4 flex gap-3 items-start">
                  <div class="text-xl">💡</div>
                  <p class="text-xs text-white/70">Not sure which one is Pawbby? Open your Smart Life app &gt; Device Settings &gt; Device Information and match the <strong>Virtual ID</strong>.</p>
                </div>
                <p class="text-xs font-bold text-[#3D7A41] uppercase tracking-wider mb-2">Select Your Device</p>
                <button v-for="d in discoveredDevices" :key="d.id" @click="selectDevice(d)"
                  class="w-full text-left bg-black/30 border border-white/10 rounded-2xl p-4 hover:border-[#3D7A41] hover:bg-[#3D7A41]/10 transition-colors group">
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="text-white font-bold text-sm">Smart Device</p>
                      <p class="text-xs text-white/50 font-mono mt-1">{{ d.id }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-[#3D7A41] font-mono bg-[#3D7A41]/20 px-2 py-1 rounded-md">{{ d.ip }}</p>
                    </div>
                  </div>
                </button>
                <div class="flex justify-between mt-4 items-center px-2">
                  <button @click="scanNetwork" class="text-xs text-[#3D7A41] hover:text-[#5BC266] font-bold underline">Scan Again</button>
                  <button @click="manualMode = true" class="text-xs text-white/40 hover:text-white underline">I don't see it / Enter manually</button>
                </div>
              </div>
              <div v-else class="text-center py-6">
                <p class="text-white/60 text-sm mb-4">We couldn't find any Tuya devices on your local network automatically.</p>
                <button @click="scanNetwork" class="px-4 py-2 bg-[#3D7A41]/20 text-[#3D7A41] rounded-lg text-sm font-bold hover:bg-[#3D7A41]/30 transition-colors mb-2">Scan Again</button>
                <button @click="manualMode = true" class="block w-full mt-2 px-4 py-2 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors">Enter Details Manually</button>
              </div>
            </div>

            <div v-if="manualMode">
              <label class="block text-xs font-bold text-pawbby-muted uppercase tracking-wider mb-2">Device ID</label>
              <input v-model="newDevice.deviceId" type="text" placeholder="Found in Tuya App"
                class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pawbby-primary transition-colors font-mono placeholder:text-white/20 mb-4" />
              
              <label class="block text-xs font-bold text-pawbby-muted uppercase tracking-wider mb-2">Local IP Address</label>
              <input v-model="newDevice.ipAddress" type="text" placeholder="e.g. 192.168.1.100"
                class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pawbby-primary transition-colors font-mono placeholder:text-white/20" />
            </div>

            <div class="flex gap-3 pt-4">
              <button @click="currentStep--; manualMode = false" class="px-6 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">
                Back
              </button>
              <button v-if="manualMode" @click="nextStep" :disabled="!newDevice.ipAddress || !newDevice.deviceId"
                class="flex-1 py-4 bg-[#3D7A41] text-white font-bold rounded-2xl hover:bg-[#3D7A41]/80 transition-colors disabled:opacity-30">
                Continue
              </button>
            </div>
          </div>

          <!-- STEP 6: Security -->
          <div v-if="currentStep === 6" class="space-y-6">
            <p class="text-pawbby-muted text-sm leading-relaxed">
              Tuya fiercely locks down their devices. To securely connect locally, we need the device's secret Local Key.
            </p>
            
            <div class="bg-black/30 border border-white/10 rounded-2xl overflow-hidden relative">
              <div class="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
                <span class="text-xs font-bold text-[#3D7A41] uppercase tracking-wider">How to get the key</span>
                <div class="flex gap-1">
                  <div class="w-2 h-2 rounded-full transition-colors" :class="guideSlide === 0 ? 'bg-[#3D7A41]' : 'bg-white/20'"></div>
                  <div class="w-2 h-2 rounded-full transition-colors" :class="guideSlide === 1 ? 'bg-[#3D7A41]' : 'bg-white/20'"></div>
                  <div class="w-2 h-2 rounded-full transition-colors" :class="guideSlide === 2 ? 'bg-[#3D7A41]' : 'bg-white/20'"></div>
                </div>
              </div>
              <div class="relative w-full h-48 sm:h-56 bg-black/50">
                <img v-if="guideSlide === 0" src="/tuya-step1.png" class="absolute inset-0 w-full h-full object-cover opacity-80" />
                <img v-if="guideSlide === 1" src="/tuya-step2.png" class="absolute inset-0 w-full h-full object-cover opacity-80" />
                <img v-if="guideSlide === 2" src="/tuya-step3.png" class="absolute inset-0 w-full h-full object-cover opacity-80" />
                
                <button @click="guideSlide = (guideSlide - 1 + 3) % 3" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-1.5 rounded-full text-white/70 hover:text-white backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button @click="guideSlide = (guideSlide + 1) % 3" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-1.5 rounded-full text-white/70 hover:text-white backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div class="p-4 text-xs text-white/80 leading-relaxed min-h-[5rem]">
                <p v-if="guideSlide === 0"><strong>1.</strong> Go to <a href="https://iot.tuya.com/" target="_blank" class="text-[#3D7A41] underline">iot.tuya.com</a> and sign up for a free developer account. Go to <strong>Cloud &gt; Projects</strong> and create a new project.</p>
                <p v-if="guideSlide === 1"><strong>2.</strong> Go to the <strong>Devices &gt; Link Tuya App Account</strong> tab. Scan the QR code using the scanner inside your Smart Life app to link your devices.</p>
                <p v-if="guideSlide === 2"><strong>3.</strong> Finally, go to <strong>Cloud &gt; API Explorer</strong>. Select <em>Get Device Details</em>, enter your Device ID ({{ newDevice.deviceId || 'bf123...' }}), and click Submit to reveal your Local Key.</p>
              </div>
            </div>

            <div class="space-y-4">
              <div v-if="!manualMode" class="bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/50 font-mono flex justify-between">
                <span>Device ID</span>
                <span>{{ newDevice.deviceId }}</span>
              </div>
              <div>
                <label class="block text-xs font-bold text-pawbby-muted uppercase tracking-wider mb-2">Local Key</label>
                <input v-model="newDevice.localKey" type="password" placeholder="16-character secret key"
                  class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pawbby-primary transition-colors font-mono placeholder:text-white/20" />
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button @click="currentStep--; manualMode = false" class="px-6 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors">
                Back
              </button>
              <button @click="handleAddDevice" :disabled="isSaving || !newDevice.deviceId || !newDevice.localKey"
                class="flex-1 py-4 bg-[#3D7A41] text-white font-bold rounded-2xl hover:bg-[#3D7A41]/80 transition-colors disabled:opacity-30 flex justify-center items-center">
                <svg v-if="isSaving" class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span v-if="isSaving">Connecting...</span>
                <span v-else>Connect Now</span>
              </button>
            </div>
          </div>

          <!-- STEP 7: Success -->
          <div v-if="currentStep === 7" class="space-y-6">
            <div class="bg-[#3D7A41]/10 border border-[#3D7A41]/20 rounded-2xl p-6 text-center">
              <div class="text-4xl mb-4">🥳</div>
              <h3 class="text-xl font-bold text-white mb-2">Connection Successful!</h3>
              <p class="text-sm text-pawbby-muted leading-relaxed mb-4">
                Pawbby Reborn is now securely talking to your litter box 100% locally. You've completely bypassed the Tuya cloud!
              </p>
              
              <div class="bg-black/30 rounded-xl p-4 text-left border border-white/5">
                <p class="text-xs text-white/80 leading-relaxed mb-2">
                  <strong>What about the apps?</strong><br>
                  You can safely delete your Tuya IoT Developer Account entirely, and you can uninstall the Smart Life app from your phone. You'll manage everything through Pawbby Reborn from now on!
                </p>
                <div class="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                  <span class="text-red-400 font-bold text-xs mt-0.5">⚠️</span>
                  <p class="text-xs text-red-300/80 leading-relaxed">
                    <strong>Important:</strong> Do not "Remove Device" from your Smart Life account before uninstalling the app, and do not delete your Smart Life consumer account. If the device is removed from the consumer cloud, it will drop off your WiFi entirely.
                  </p>
                </div>
              </div>
            </div>

            <button @click="closeModal"
              class="w-full py-4 bg-[#3D7A41] text-white font-bold rounded-2xl hover:bg-[#3D7A41]/80 transition-colors">
              Finish & Go to Dashboard
            </button>
          </div>

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

const currentStep = ref(1)
const hasSmartLife = ref(false)
const isScanning = ref(false)
const discoveredDevices = ref<any[]>([])
const manualMode = ref(false)
const guideSlide = ref(0)

const scanNetwork = async () => {
  isScanning.value = true
  try {
    const res = await fetch('/api/devices/discover')
    discoveredDevices.value = await res.json()
  } catch (e) {
    // Ignore error
  } finally {
    isScanning.value = false
  }
}

const selectDevice = (d: any) => {
  newDevice.value.ipAddress = d.ip
  newDevice.value.deviceId = d.id
  nextStep()
}

const nextStep = () => {
  manualMode.value = false
  if (currentStep.value === 4) {
    scanNetwork()
  }
  if (currentStep.value < 7) currentStep.value++
}

const closeModal = () => {
  showAddModal.value = false
  currentStep.value = 1
  hasSmartLife.value = false
  manualMode.value = false
  guideSlide.value = 0
}

const handleAddDevice = async () => {
  if (!newDevice.value.deviceId) {
    alert("Device ID is required.")
    return
  }
  isSaving.value = true
  try {
    await api.createDevice(newDevice.value)
    // Refresh devices
    const res = await $fetch('/api/devices')
    devices.value = res as any[]
    
    // Move to step 7 for success message
    currentStep.value = 7
    // reset form (done on actual close)
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

const showUpdateBanner = ref(false)

const checkForUpdates = async () => {
  try {
    const res = await fetch('/api/update')
    const data = await res.json()
    if (data.updateAvailable) {
      const dismissedAt = localStorage.getItem('updateBannerDismissedAt')
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10)
        const now = Date.now()
        if (now - dismissedTime < 86400000) { // 24 hours
          return
        }
      }
      showUpdateBanner.value = true
    }
  } catch (e) {
    // Ignore error
  }
}

const dismissUpdateBanner = () => {
  showUpdateBanner.value = false
  localStorage.setItem('updateBannerDismissedAt', Date.now().toString())
}

onMounted(() => {
  loadDevices()
  checkForUpdates()
})
</script>
