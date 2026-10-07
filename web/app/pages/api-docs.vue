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
  "action": "clean" // "clean", "flatten", "empty", "tare", or "cancel_clean"
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
  "litterLevel": "Sufficient",
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
  pawbby_tare:
    url: "http://YOUR_PAWBBY_IP:3333/api/external/action"
    method: POST
    headers:
      Authorization: "Bearer YOUR_API_KEY"
      Content-Type: "application/json"
    payload: '{"deviceId": "YOUR_DEVICE_ID", "action": "tare"}'
  pawbby_cancel_clean:
    url: "http://YOUR_PAWBBY_IP:3333/api/external/action"
    method: POST
    headers:
      Authorization: "Bearer YOUR_API_KEY"
      Content-Type: "application/json"
    payload: '{"deviceId": "YOUR_DEVICE_ID", "action": "cancel_clean"}'
        </div>
        <p class="text-xs text-pawbby-muted">Call the commands from an automation or a <code class="text-white/80">script</code> via <code class="text-white/80">service: rest_command.pawbby_clean</code>. Home Assistant must be able to reach Pawbby over your local network. <code class="text-white/80">WEBHOOK_STRICT_MODE</code> only affects outbound webhooks, not this inbound API.</p>
        <p class="text-xs text-pawbby-primary/90 mt-2">✨ All actions (<code class="text-white/80">clean</code>, <code class="text-white/80">flatten</code>, <code class="text-white/80">empty</code>, <code class="text-white/80">tare</code>, and <code class="text-white/80">cancel_clean</code>) are fully supported via local LAN control and protected by safety interlocks.</p>
      </section>

      <section class="bg-black/20 rounded-2xl p-6 border border-white/5">
        <h2 class="text-lg font-bold mb-4 text-pawbby-primary">📡 MQTT & Home Assistant Auto-Discovery</h2>
        <p class="text-sm text-pawbby-muted mb-4">
          Pawbby Reborn features a built-in MQTT bridge that connects directly to your broker (e.g. Mosquitto). Configure your broker credentials under <NuxtLink to="/settings" class="text-pawbby-primary underline">Settings &gt; MQTT Broker</NuxtLink>.
        </p>
        <p class="text-sm text-pawbby-muted mb-4">
          Once connected, Pawbby automatically announces all litter boxes, cats, sensors, buttons, and the new <strong>Event entity</strong> to Home Assistant via MQTT Discovery (<code class="bg-white/10 px-1 rounded text-white/90">homeassistant/#</code>). <strong>No YAML configuration required!</strong>
        </p>

        <h3 class="font-bold text-sm mb-2 text-white/80">🏠 Home Assistant Event Entity (<code class="font-mono text-xs">event.pawbby_&lt;name&gt;_event</code>)</h3>
        <p class="text-sm text-pawbby-muted mb-3">
          Instead of polling or relying on state changes, every lifecycle event is published instantaneously as a native Home Assistant Event entity. Perfect for instant notifications and triggering automations!
        </p>
        <div class="bg-black/40 rounded-xl p-4 text-xs font-mono text-white/80 mb-4 overflow-x-auto">
          <p class="font-bold text-pawbby-primary mb-2">Supported event_types:</p>
          <ul class="list-disc pl-5 space-y-1 text-white/70">
            <li><code class="text-white">toileted</code> &mdash; Cat finished visiting (includes <code class="text-white">pet</code>, <code class="text-white">weight</code> in kg, and <code class="text-white">duration</code> in seconds)</li>
            <li><code class="text-white">quick-visit</code> &mdash; Cat stepped inside briefly and hopped out</li>
            <li><code class="text-white">auto-clean</code> / <code class="text-white">manual-clean</code> &mdash; Cleaning cycle started</li>
            <li><code class="text-white">clean-completed</code> &mdash; Cleaning cycle finished successfully</li>
            <li><code class="text-white">flatten</code> / <code class="text-white">auto-flatten</code> &mdash; Litter bed flattened</li>
            <li><code class="text-white">empty</code> &mdash; Drum emptying cycle</li>
            <li><code class="text-white">bin-full</code> / <code class="text-white">bin-normal</code> &mdash; Waste bin full / emptied</li>
            <li><code class="text-white">bin-removed</code> / <code class="text-white">bin-replaced</code> &mdash; Waste drawer detached / re-inserted</li>
            <li><code class="text-white">lid-removed</code> / <code class="text-white">lid-replaced</code> &mdash; Top cover removed / re-attached</li>
            <li><code class="text-white">drum-removed</code> / <code class="text-white">drum-installed</code> &mdash; Main drum removed / installed</li>
            <li><code class="text-white">litter-low</code> / <code class="text-white">litter-sufficient</code> &mdash; Litter level warning / normal</li>
          </ul>
        </div>

        <h3 class="font-bold text-sm mb-2 text-white/80">Example Home Assistant Automation (Instant Visit Notification)</h3>
        <div class="bg-black/50 rounded-xl p-4 text-sm font-mono text-white/80 overflow-x-auto mb-4 whitespace-pre" v-pre>
alias: "Pawbby: Cat Visit Alert"
trigger:
  - platform: state
    entity_id: event.pawbby_litter_box_event
    attribute: event_type
    to: "toileted"
action:
  - service: notify.notify
    data:
      title: "🐾 Litter Box Visit"
      message: >-
        {{ state_attr('event.pawbby_litter_box_event', 'pet') or 'A cat' }}
        used the box ({{ state_attr('event.pawbby_litter_box_event', 'weight') }} kg,
        {{ state_attr('event.pawbby_litter_box_event', 'duration') }}s).
        </div>

        <h3 class="font-bold text-sm mb-2 text-white/80">MQTT Topics Reference</h3>
        <div class="bg-black/50 rounded-xl p-4 text-xs font-mono text-white/80 overflow-x-auto mb-4 space-y-3">
          <div>
            <span class="text-pawbby-primary font-bold">Live Event Stream:</span>
            <p class="text-white/70"><code>pawbby/&lt;deviceId&gt;/event</code> (device-specific) and <code>pawbby/events</code> (global stream)</p>
            <p class="text-white/50 text-[11px] mt-1">Payload: <code>{"event_type": "toileted", "deviceId": "...", "deviceName": "...", "pet": "Milo", "weight": 4.15, "duration": 95, "timestamp": "..."}</code></p>
          </div>
          <div>
            <span class="text-pawbby-primary font-bold">Live State:</span>
            <p class="text-white/70"><code>pawbby/&lt;deviceId&gt;/state</code> (retained JSON with status, wasteBin, litterLevel, cleaning, etc.)</p>
          </div>
          <div>
            <span class="text-pawbby-primary font-bold">Cat Telemetry:</span>
            <p class="text-white/70"><code>pawbby/pet/&lt;petId&gt;/state</code> (retained JSON with latestWeight, lastDuration, visitsToday, lastUsedAt)</p>
          </div>
          <div>
            <span class="text-pawbby-primary font-bold">Availability (LWT):</span>
            <p class="text-white/70"><code>pawbby/status</code> &rarr; <code>online</code> / <code>offline</code></p>
          </div>
          <div>
            <span class="text-pawbby-primary font-bold">Action Control:</span>
            <p class="text-white/70"><code>pawbby/&lt;deviceId&gt;/command/&lt;action&gt;</code> &mdash; Actions: <code>clean</code>, <code>flatten</code>, <code>empty</code>, <code>tare</code>, <code>cancel_clean</code></p>
            <p class="text-white/50 text-[11px] mt-1">Payload: <code>PRESS</code> or any payload triggers the action.</p>
          </div>
        </div>

        <h3 class="font-bold text-sm mb-2 text-white/80">Entities Created in Home Assistant Automatically</h3>
        <ul class="list-disc pl-5 text-sm text-pawbby-muted space-y-1 mb-2">
          <li><strong>Event Entity:</strong> <code class="text-white/80">event.pawbby_&lt;device&gt;_event</code></li>
          <li><strong>Sensors:</strong> Status, Waste Bin, Litter Level, Last Cleaned (<code class="text-white/80">timestamp</code>), Today's Visits, Last Visit Pet, Last Visit Weight, Deodorizer Days Left</li>
          <li><strong>Binary Sensors:</strong> Online (<code class="text-white/80">connectivity</code>), Cleaning (<code class="text-white/80">running</code>), Bin Full (<code class="text-white/80">problem</code>), Bin Removed (<code class="text-white/80">problem</code>), Drum Removed (<code class="text-white/80">problem</code>), Litter Low (<code class="text-white/80">problem</code>), Lid Open (<code class="text-white/80">opening</code>)</li>
          <li><strong>Action Buttons:</strong> Clean, Flatten, Empty, Zero Scale (Tare), Cancel Clean</li>
          <li><strong>Per-Cat Devices:</strong> Each pet is added as a dedicated Home Assistant device with weight measurement (<code class="text-white/80">state_class: measurement</code>), visit duration, visits today, and last used timestamp.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'detail'
})
</script>
