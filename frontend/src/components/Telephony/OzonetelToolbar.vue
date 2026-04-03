<template>
  <div v-if="iframeEnabled" class="ozonetel-toolbar-wrapper">
    <!-- Toggle button -->
    <button
      class="ozonetel-toggle-btn"
      :title="isPanelOpen ? __('Hide Ozonetel Toolbar') : __('Show Ozonetel Toolbar')"
      @click="isPanelOpen = !isPanelOpen"
    >
      <svg
        v-if="!isPanelOpen"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <!-- Iframe panel -->
    <div v-show="isPanelOpen" class="ozonetel-panel">
      <div class="ozonetel-panel-header">
        <span class="ozonetel-panel-title">{{ __('Ozonetel Agent') }}</span>
        <button class="ozonetel-panel-close" @click="isPanelOpen = false">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <iframe
        id="cloudagent_iframe"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads"
        allow="geolocation; microphone; display-capture"
        :src="iframeUrl"
        width="350"
        height="560"
        class="ozonetel-iframe"
      />
    </div>
  </div>
</template>

<script setup>
import { createResource } from 'frappe-ui'
import { ref } from 'vue'

const iframeEnabled = ref(false)
const iframeUrl = ref('')
const isPanelOpen = ref(false)

createResource({
  url: 'ozonetel_integration.api.agent.get_iframe_config',
  cache: 'Ozonetel Iframe Config',
  auto: true,
  onSuccess: (data) => {
    iframeEnabled.value = Boolean(data?.enabled)
    iframeUrl.value = data?.iframe_url || ''
  },
})
</script>

<style scoped>
.ozonetel-toolbar-wrapper {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
}

.ozonetel-toggle-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary, #171717);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ozonetel-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.ozonetel-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 350px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-color, #e2e8f0);
  background: white;
}

.ozonetel-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface-menu-bar, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.ozonetel-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color, #1a202c);
}

.ozonetel-panel-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #718096);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.ozonetel-panel-close:hover {
  background: var(--hover-color, #edf2f7);
}

.ozonetel-iframe {
  display: block;
  border: none;
  width: 350px;
  height: 560px;
}
</style>
