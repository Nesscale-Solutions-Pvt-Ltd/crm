import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import { parseColor, isTranslatable } from '@/utils'
import { defineStore } from 'pinia'
import { useTelemetry } from 'frappe-ui/frappe'
import { createListResource } from 'frappe-ui'
import { reactive, h } from 'vue'

export const ticketStatusesStore = defineStore('hd-ticket-statuses', () => {
  let ticketStatusesByName = reactive({})

  const { capture } = useTelemetry()

  const ticketStatuses = createListResource({
    doctype: 'HD Ticket Status',
    fields: ['name', 'color', 'order', 'category'],
    orderBy: 'order asc',
    cache: 'hd-ticket-statuses',
    initialData: [],
    auto: true,
    transform(statuses) {
      for (let status of statuses) {
        status.color = parseColor(status.color)
        ticketStatusesByName[status.name] = status
      }
      return statuses
    },
  })

  function getTicketStatus(name) {
    if (!name) {
      name = ticketStatuses.data?.[0]?.name
    }
    return ticketStatusesByName[name]
  }

  function statusOptions(statuses = [], triggerStatusChange = null) {
    let statusesByName = ticketStatusesByName

    if (statuses?.length) {
      statusesByName = statuses.reduce((acc, status) => {
        acc[status] = ticketStatusesByName[status]
        return acc
      }, {})
    }

    let translatable = isTranslatable('HD Ticket Status')

    let options = []
    for (const status in statusesByName) {
      options.push({
        label: translatable
          ? __(statusesByName[status]?.name)
          : statusesByName[status]?.name,
        value: statusesByName[status]?.name,
        icon: () => h(IndicatorIcon, { class: statusesByName[status]?.color }),
        onClick: async () => {
          await triggerStatusChange?.(statusesByName[status]?.name)
          capture('status_changed', { doctype: 'ticket', status })
        },
      })
    }
    return options
  }

  return {
    ticketStatuses,
    getTicketStatus,
    statusOptions,
  }
})
