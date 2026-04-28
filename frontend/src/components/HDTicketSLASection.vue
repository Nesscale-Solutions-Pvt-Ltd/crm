<template>
  <div class="flex flex-col gap-1.5 border-b sm:px-6 py-3 px-4">
    <div
      v-for="s in sections"
      :key="s.label"
      class="flex items-center gap-2 text-base leading-5"
    >
      <div class="sm:w-[106px] w-36 text-sm text-ink-gray-5">
        {{ __(s.label) }}
      </div>
      <div class="grid min-h-[28px] items-center">
        <Tooltip v-if="s.tooltipText" :text="s.tooltipText">
          <div class="ml-2 cursor-pointer">
            <Badge
              class="-ml-1"
              :label="s.value"
              variant="subtle"
              :theme="s.color"
            />
          </div>
        </Tooltip>
        <div v-else class="ml-2">
          <Badge
            class="-ml-1"
            :label="s.value"
            variant="subtle"
            :theme="s.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Tooltip, Badge } from 'frappe-ui'
import { formatDate } from '@/utils'
import { computed, onUnmounted, ref } from 'vue'

const data = defineModel({ type: Object, default: () => ({}) })

// Format seconds to "Xd Yh Zm" (drop seconds for SLA display).
function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  let out = ''
  if (days > 0) out += `${days}d `
  if (hours > 0 || days > 0) out += `${hours}h `
  out += `${minutes}m`
  return out.trim() || '< 1m'
}

// tick every 30s — minute precision doesn't need 1s updates
const now = ref(Date.now())
const tick = setInterval(() => (now.value = Date.now()), 30000)
onUnmounted(() => clearInterval(tick))

function diffSecs(target) {
  if (!target) return 0
  return Math.floor((new Date(target).getTime() - now.value) / 1000)
}

function elapsedSecs(from, to) {
  if (!from || !to) return 0
  return Math.floor(
    (new Date(to).getTime() - new Date(from).getTime()) / 1000,
  )
}

const statusBadge = computed(() => {
  const status = data.value.agreement_status
  if (!status) return null
  const colorMap = {
    Fulfilled: 'green',
    Failed: 'red',
    Paused: 'blue',
    'First Response Due': 'orange',
    'Resolution Due': 'orange',
  }
  return {
    label: 'SLA Status',
    value: status,
    color: colorMap[status] || 'gray',
    tooltipText: data.value.sla ? `Policy: ${data.value.sla}` : null,
  }
})

const responseBadge = computed(() => {
  const responseBy = data.value.response_by
  const respondedOn = data.value.first_responded_on
  if (!responseBy && !respondedOn) return null

  if (respondedOn) {
    const ok = new Date(respondedOn) <= new Date(responseBy)
    return {
      label: 'First Response',
      value:
        (ok ? 'Fulfilled' : 'Failed') +
        ' in ' +
        formatTime(elapsedSecs(data.value.creation, respondedOn)),
      color: ok ? 'green' : 'red',
      tooltipText: formatDate(respondedOn),
    }
  }

  const secs = diffSecs(responseBy)
  if (secs > 0) {
    return {
      label: 'First Response',
      value: 'Due in ' + formatTime(secs),
      color: 'orange',
      tooltipText: formatDate(responseBy),
    }
  }
  return {
    label: 'First Response',
    value: 'Failed (' + formatTime(-secs) + ' overdue)',
    color: 'red',
    tooltipText: formatDate(responseBy),
  }
})

const resolutionBadge = computed(() => {
  const resolutionBy = data.value.resolution_by
  const resolvedOn = data.value.resolution_date
  if (!resolutionBy && !resolvedOn) return null

  if (data.value.agreement_status === 'Paused') {
    const secs = diffSecs(resolutionBy)
    return {
      label: 'Resolution',
      value:
        (secs > 0 ? formatTime(secs) + ' left' : 'Overdue') + ' (On Hold)',
      color: 'blue',
      tooltipText: formatDate(resolutionBy),
    }
  }

  if (resolvedOn) {
    const ok = new Date(resolvedOn) <= new Date(resolutionBy)
    return {
      label: 'Resolution',
      value:
        (ok ? 'Fulfilled' : 'Failed') +
        ' in ' +
        formatTime(elapsedSecs(data.value.creation, resolvedOn)),
      color: ok ? 'green' : 'red',
      tooltipText: formatDate(resolvedOn),
    }
  }

  const secs = diffSecs(resolutionBy)
  if (secs > 0) {
    return {
      label: 'Resolution',
      value: 'Due in ' + formatTime(secs),
      color: 'orange',
      tooltipText: formatDate(resolutionBy),
    }
  }
  return {
    label: 'Resolution',
    value: 'Failed (' + formatTime(-secs) + ' overdue)',
    color: 'red',
    tooltipText: formatDate(resolutionBy),
  }
})

const sections = computed(() =>
  [statusBadge.value, responseBadge.value, resolutionBadge.value].filter(
    Boolean,
  ),
)
</script>
