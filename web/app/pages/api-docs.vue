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
curl -X POST http://YOUR_PAWBBY_IP:3333/api/external/action \
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
curl "http://YOUR_PAWBBY_IP:3333/api/external/events?deviceId=device_id_here&limit=10&from=2023-10-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_API_KEY"
        </div>
      </section>

      <section class="bg-black/20 rounded-2xl p-6 border border-white/5">
        <h2 class="text-lg font-bold mb-4 text-pawbby-primary">Get Live State</h2>
        <div class="flex items-center gap-3 mb-4">
          <span class="bg-[#3D7A41]/20 text-[#3D7A41] px-2 py-1 rounded font-bold text-xs">GET</span>
          <code class="text-sm font-mono">/api/external/state</code>
        </div>
        <p class="text-sm text-pawbby-muted mb-4">Returns the current state of a device (status, waste bin, litter level, last visit, deodorizer). Ideal for polling from Home Assistant. Omit <code class="text-white/80">deviceId</code> to receive an array of all devices.</p>

        <h3 class="font-bold text-sm mb-2 text-white/80">Query Parameters</h3>
        <ul class="list-disc pl-5 text-sm text-pawbby-muted mb-4 space-y-2">
          <li><code class="text-white/80">deviceId</code> (optional) - The ID of your device. If omitted, all devices are returned under a <code class="text-white/80">devices</code> array.</li>
        </ul>

        <h3 class="font-bold text-sm mb-2 text-white/80">Example Response</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto mb-4 whitespace-pre" v-pre>
{
  "id": "device_id_here",
  "name": "Litter Box",
  "deviceId": "tuya-abc-123",
  "mode": "local",
  "online": true,
  "status": "Ready",
  "wasteBin": "Normal",
  "litterLevel": "Sufficient*",
  "lidOpen": false,
  "binRemoved": false,
  "todayToileted": 3,
  "latestWeight": 4.15,
  "lastVisitPet": "Milo",
  "lastVisitAt": "2026-07-22T20:21:45.000Z",
  "deodorizerActive": true,
  "deodorizerDaysLeft": 21,
  "lastHeartbeat": "2026-07-22T20:31:45.000Z",
  "pets": [
    {
      "id": "pet_id_here",
      "name": "Milo",
      "profileWeight": 4.2,
      "lastUsedAt": "2026-07-22T20:21:45.000Z",
      "latestWeight": 4.15,
      "lastDuration": 95,
      "visitsToday": 2
    }
  ]
}
        </div>
        <p class="text-xs text-pawbby-muted mb-4">The <code class="text-white/80">pets</code> array lists every cat with raw datapoints: last visit time, latest visit weight (kg), last visit duration (seconds) and visits today. These are intentionally raw — Home Assistant keeps long-term statistics, so you can build weight/duration trends yourself with a statistics or derivative helper. Over MQTT, each cat is published as its own Home Assistant device automatically (the weight and duration sensors use <code class="text-white/80">state_class: measurement</code> so HA records their history).</p>

        <h3 class="font-bold text-sm mb-2 text-white/80">Example cURL</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto whitespace-pre">
curl "http://YOUR_PAWBBY_IP:3333/api/external/state?deviceId=device_id_here" \
  -H "Authorization: Bearer YOUR_API_KEY"
        </div>
      </section>

      <section class="bg-black/20 rounded-2xl p-6 border border-white/5">
        <h2 class="text-lg font-bold mb-4 text-pawbby-primary">🏠 Home Assistant</h2>
        <p class="text-sm text-pawbby-muted mb-4">Pawbby Reborn works with Home Assistant out of the box using the built-in <code class="bg-white/10 px-1 rounded text-white/90">rest</code> integration — no custom component required. Add the following to your <code class="bg-white/10 px-1 rounded text-white/90">configuration.yaml</code>, replacing <code class="text-white/80">YOUR_PAWBBY_IP</code>, <code class="text-white/80">YOUR_DEVICE_ID</code> and <code class="text-white/80">YOUR_API_KEY</code>, then restart Home Assistant.</p>

        <h3 class="font-bold text-sm mb-2 text-white/80">Sensors (polls live state)</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto mb-4 whitespace-pre" v-pre>
rest:
  - resource: "http://YOUR_PAWBBY_IP:3333/api/external/state?deviceId=YOUR_DEVICE_ID"
    scan_interval: 60
    headers:
      Authorization: "Bearer YOUR_API_KEY"
    sensor:
      - name: "Litter Box Status"
        value_template: "{{ value_json.status }}"
      - name: "Litter Box Waste Bin"
        value_template: "{{ value_json.wasteBin }}"
      - name: "Litter Box Litter Level"
        value_template: "{{ value_json.litterLevel }}"
      - name: "Litter Box Visits Today"
        value_template: "{{ value_json.todayToileted }}"
        unit_of_measurement: "visits"
        state_class: total_increasing
      - name: "Litter Box Last Visit Weight"
        value_template: "{{ value_json.latestWeight }}"
        unit_of_measurement: "kg"
        device_class: weight
        state_class: measurement
      - name: "Litter Box Last Visit Pet"
        value_template: "{{ value_json.lastVisitPet }}"
      - name: "Litter Box Deodorizer Days Left"
        value_template: "{{ value_json.deodorizerDaysLeft }}"
        unit_of_measurement: "days"
    binary_sensor:
      - name: "Litter Box Online"
        value_template: "{{ 'on' if value_json.online else 'off' }}"
        device_class: connectivity
      - name: "Litter Box Lid Open"
        value_template: "{{ 'on' if value_json.lidOpen else 'off' }}"
        device_class: opening
      - name: "Litter Box Waste Bin Full"
        value_template: "{{ 'on' if value_json.wasteBin == 'Full' else 'off' }}"
        device_class: problem
        </div>

        <h3 class="font-bold text-sm mb-2 text-white/80">Buttons (trigger actions)</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto mb-4 whitespace-pre" v-pre>
rest_command:
  pawbby_clean:
    url: "http://YOUR_PAWBBY_IP:3333/api/external/action"
    method: POST
    headers:
      Authorization: "Bearer YOUR_API_KEY"
      Content-Type: "application/json"
    payload: '{"deviceId": "YOUR_DEVICE_ID", "action": "clean"}'
  pawbby_flatten:
    url: "http://YOUR_PAWBBY_IP:3333/api/external/action"
    method: POST
    headers:
      Authorization: "Bearer YOUR_API_KEY"
      Content-Type: "application/json"
    payload: '{"deviceId": "YOUR_DEVICE_ID", "action": "flatten"}'
  pawbby_empty:
    url: "http://YOUR_PAWBBY_IP:3333/api/external/action"
    method: POST
    headers:
      Authorization: "Bearer YOUR_API_KEY"
      Content-Type: "application/json"
    payload: '{"deviceId": "YOUR_DEVICE_ID", "action": "empty"}'
        </div>
        <p class="text-xs text-pawbby-muted">Call the commands from an automation or a <code class="text-white/80">script</code> via <code class="text-white/80">service: rest_command.pawbby_flatten</code>. Home Assistant must be able to reach Pawbby over your local network. <code class="text-white/80">WEBHOOK_STRICT_MODE</code> only affects outbound webhooks, not this inbound API.</p>
        <p class="text-xs text-[#D84C4C]/90 mt-2">⚠️ Note: <code class="text-white/80">flatten</code> (straighten litter) and <code class="text-white/80">empty</code> are fully supported. <code class="text-white/80">clean</code> is not yet implemented — its device payload hasn't been reverse-engineered, so the command is currently a no-op (and is omitted from the MQTT buttons).</p>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'detail'
})
</script>
