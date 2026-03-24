<template>
  <Dialog v-model="show" :options="{ size: '3xl' }">
    <template #body>
      <div class="bg-surface-modal px-4 pb-6 pt-5 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">
              {{ __('Create Ticket') }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <Button
              v-if="isManager() && !isMobileView"
              variant="ghost"
              class="w-7"
              :tooltip="__('Edit Fields Layout')"
              :icon="EditIcon"
              @click="openQuickEntryModal"
            />
            <Button
              variant="ghost"
              class="w-7"
              icon="x"
              @click="show = false"
            />
          </div>
        </div>
        <div>
          <FieldLayout v-if="tabs.data" :tabs="tabs.data" :data="ticket.doc" doctype="HD Ticket" />
          <ErrorMessage v-if="error" class="mt-4" :message="__(error)" />
        </div>
      </div>
      <div class="px-4 pb-7 pt-4 sm:px-6">
        <div class="flex flex-row-reverse gap-2">
          <Button
            variant="solid"
            :label="__('Create')"
            :loading="isTicketCreating"
            @click="createNewTicket"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import EditIcon from '@/components/Icons/EditIcon.vue'
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import { usersStore } from '@/stores/users'
import { ticketStatusesStore } from '@/stores/ticketStatuses'
import { sessionStore } from '@/stores/session'
import { isMobileView } from '@/composables/settings'
import { showQuickEntryModal, quickEntryProps } from '@/composables/modals'
import { createResource } from 'frappe-ui'
import { useDocument } from '@/data/document'
import { computed, onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  defaults: { type: Object, default: () => ({}) },
})

const { user } = sessionStore()
const { getUser, isManager } = usersStore()
const { getTicketStatus, statusOptions } = ticketStatusesStore()

const show = defineModel({ type: Boolean })
const router = useRouter()
const error = ref(null)
const isTicketCreating = ref(false)

const { document: ticket } = useDocument('HD Ticket')

const ticketStatuses = computed(() => statusOptions())

const tabs = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout',
  cache: ['QuickEntry', 'HD Ticket'],
  params: { doctype: 'HD Ticket', type: 'Quick Entry' },
  auto: true,
  transform: (_tabs) => {
    return _tabs.forEach((tab) => {
      tab.sections.forEach((section) => {
        section.columns.forEach((column) => {
          column.fields.forEach((field) => {
            if (field.fieldname == 'status') {
              field.fieldtype = 'Select'
              field.options = ticketStatuses.value
              field.prefix = getTicketStatus(ticket.doc.status)?.color
            }
          })
        })
      })
    })
  },
})

const createTicket = createResource({
  url: 'frappe.client.insert',
})

async function createNewTicket() {
  createTicket.submit(
    {
      doc: {
        doctype: 'HD Ticket',
        ...ticket.doc,
      },
    },
    {
      validate() {
        error.value = null
        if (!ticket.doc.subject) {
          error.value = __('Subject is mandatory')
          return error.value
        }
        if (!ticket.doc.status) {
          error.value = __('Status is required')
          return error.value
        }
        if (
          ticket.doc.raised_by &&
          !ticket.doc.raised_by.includes('@')
        ) {
          error.value = __('Invalid email address for Raised By')
          return error.value
        }
        isTicketCreating.value = true
      },
      onSuccess(data) {
        isTicketCreating.value = false
        show.value = false
        router.push({ name: 'Ticket', params: { ticketId: data.name } })
      },
      onError(err) {
        isTicketCreating.value = false
        if (!err.messages) {
          error.value = err.message
          return
        }
        error.value = err.messages.join('\n')
      },
    },
  )
}

function openQuickEntryModal() {
  showQuickEntryModal.value = true
  quickEntryProps.value = { doctype: 'HD Ticket' }
  nextTick(() => (show.value = false))
}

onMounted(() => {
  Object.assign(ticket.doc, props.defaults)

  if (!ticket.doc?.ticket_owner) {
    ticket.doc.ticket_owner = getUser().name
  }
  if (!ticket.doc?.status && ticketStatuses.value[0]?.value) {
    ticket.doc.status = ticketStatuses.value[0].value
  }
})
</script>
