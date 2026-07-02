<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen bg-[#201e1b] text-white flex flex-col items-center justify-center p-6 font-sans">
    <div class="max-w-lg w-full bg-[#2a2824] rounded-xl p-8 shadow-xl border border-red-500/30 text-center">
      <div class="w-24 h-24 mx-auto mb-6">
        <img src="/logo-nobg.png" alt="Pawbby Logo" class="w-full h-full object-contain drop-shadow-md" />
      </div>

      <h1 class="text-3xl font-bold text-gray-100 mb-4">Something ain't right...</h1>
      <p class="text-gray-400 mb-6">
        We encountered a critical error while trying to boot up or serve your request. This is usually caused by a
        missing database connection or a configuration issue.
      </p>

      <div v-if="error?.message"
        class="bg-black/50 border border-gray-700/50 rounded-lg p-4 mb-6 text-left overflow-x-auto">
        <code class="text-sm text-red-400 font-mono">{{ error.message }}</code>
      </div>

      <div class="text-sm text-gray-400 bg-white/5 rounded-lg p-5">
        <p class="mb-3 font-semibold text-gray-300">Quick Fixes:</p>
        <ul class="list-disc text-left pl-5 space-y-2">
          <li>Check if your <code>DATABASE_URL</code> is set correctly in your environment or <code>.env</code> file.
          </li>
          <li>Ensure the database file (e.g. <code>pawbby.db</code>, <code>dev.db</code>) actually exists and is
            readable.</li>
          <li>If you're running in Docker, try running <code>docker compose down</code> followed by
            <code>docker compose up --build -d</code>.
          </li>
        </ul>
      </div>

      <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button @click="handleError"
          class="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/20">
          Refresh & Try Again
        </button>
        <a href="https://discord.gg/Tw43AKZkge" target="_blank"
          class="px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#5865F2]/20 flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .02.059c.236.466.51.91.819 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
          </svg>
          Community Support
        </a>
      </div>
    </div>
  </div>
</template>
