<template>
  <div class="flex flex-col min-h-screen pb-10 px-4 pt-6">
    <header class="flex items-center mb-8">
      <NuxtLink to="/settings" class="text-white hover:text-white/80 transition-colors p-2 -ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-xl font-bold text-white/90 flex-1 text-center pr-8">API Documentation</h1>
    </header>

    <div class="space-y-8 text-white/90">
      <section class="bg-black/20 rounded-2xl p-6 border border-white/5">
        <h2 class="text-lg font-bold mb-4 text-pawbby-primary">Authentication</h2>
        <p class="text-sm text-pawbby-muted mb-4">All external API endpoints require an API Key. You can generate one in the Settings page.</p>
        <p class="text-sm text-pawbby-muted mb-2">Include the API Key in the <code class="bg-white/10 px-1 rounded text-white/90">Authorization</code> header of your requests:</p>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto">
          Authorization: Bearer YOUR_API_KEY
        </div>
      </section>

      <section class="bg-black/20 rounded-2xl p-6 border border-white/5">
        <h2 class="text-lg font-bold mb-4 text-pawbby-primary">Trigger Device Action</h2>
        <div class="flex items-center gap-3 mb-4">
          <span class="bg-[#5865F2]/20 text-[#5865F2] px-2 py-1 rounded font-bold text-xs">POST</span>
          <code class="text-sm font-mono">/api/external/action</code>
        </div>
        <p class="text-sm text-pawbby-muted mb-4">Triggers an action on your Pawbby litter box.</p>
        
        <h3 class="font-bold text-sm mb-2 text-white/80">Request Body (JSON)</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto mb-4 whitespace-pre">
{
  "deviceId": "YOUR_DEVICE_ID",
  "action": "clean" // "clean", "flatten", or "empty"
}
        </div>

        <h3 class="font-bold text-sm mb-2 text-white/80">Example cURL</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto whitespace-pre">
curl -X POST http://localhost:3000/api/external/action \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "device_id_here", "action": "clean"}'
        </div>
      </section>

      <section class="bg-black/20 rounded-2xl p-6 border border-white/5">
        <h2 class="text-lg font-bold mb-4 text-pawbby-primary">Get Event History</h2>
        <div class="flex items-center gap-3 mb-4">
          <span class="bg-[#3D7A41]/20 text-[#3D7A41] px-2 py-1 rounded font-bold text-xs">GET</span>
          <code class="text-sm font-mono">/api/external/events</code>
        </div>
        <p class="text-sm text-pawbby-muted mb-4">Retrieves the recent event history for a device (e.g., cat visits, cleans, flattening).</p>
        
        <h3 class="font-bold text-sm mb-2 text-white/80">Query Parameters</h3>
        <ul class="list-disc pl-5 text-sm text-pawbby-muted mb-4 space-y-2">
          <li><code class="text-white/80">deviceId</code> (required) - The ID of your device.</li>
          <li><code class="text-white/80">limit</code> (optional) - Number of events to return. Default is 50.</li>
          <li><code class="text-white/80">from</code> (optional) - Start date for filtering events (ISO 8601 string, e.g., <code class="text-white/80">2023-10-01T00:00:00Z</code>).</li>
          <li><code class="text-white/80">to</code> (optional) - End date for filtering events (ISO 8601 string).</li>
        </ul>

        <h3 class="font-bold text-sm mb-2 text-white/80">Example cURL</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto whitespace-pre">
curl "http://localhost:3000/api/external/events?deviceId=device_id_here&limit=10&from=2023-10-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_API_KEY"
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'detail'
})
</script>
