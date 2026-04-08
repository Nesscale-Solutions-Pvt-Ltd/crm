<template>
  <LayoutHeader v-if="contact.doc">
    <template #left-header>
      <Breadcrumbs :items="breadcrumbs">
        <template #prefix="{ item }">
          <Icon v-if="item.icon" :icon="item.icon" class="mr-2 h-4" />
        </template>
      </Breadcrumbs>
    </template>
    <template #right-header>
      <CustomActions
        v-if="contact._actions?.length"
        :actions="contact._actions"
      />
    </template>
  </LayoutHeader>
  <div v-if="contact.doc" class="flex h-full overflow-hidden">
    <Tabs
      v-model="tabIndex"
      :tabs="tabs"
      class="flex flex-1 overflow-hidden flex-col [&_[role='tab']]:px-0 [&_[role='tablist']]:px-5 [&_[role='tablist']]:gap-7.5 [&_[role='tabpanel']:not([hidden])]:flex [&_[role='tabpanel']:not([hidden])]:grow"
    >
      <template #tab-panel="{ tab }">
        <div v-if="tab.label === 'Contact Information'" class="h-full flex flex-col px-3 sm:px-10">
          <DataFields
            :doctype="'Contact'"
            :docname="contact.doc.name"
          />
        </div>
        <div v-if="tab.label === 'Leads'" class="flex flex-1 flex-col overflow-hidden">
          <ListView
            v-if="leadRows.length"
            class="mt-4"
            :columns="leadColumns"
            :rows="leadRows"
            :options="{
              getRowRoute: (row) => ({
                name: 'Lead',
                params: { leadId: row.name },
              }),
              selectable: false,
              showTooltip: false,
            }"
            row-key="name"
          >
            <ListRows v-slot="{ idx, column, item, row }" :rows="leadRows" doctype="CRM Lead">
              <ListRowItem :item="item" :align="column.align">
                <template #prefix>
                  <UserAvatar
                    v-if="column.key === 'lead_owner' && item.label"
                    :user="item.user"
                    size="sm"
                  />
                </template>
                <template #default="{ label }">
                  <Badge
                    v-if="column.key === 'status'"
                    variant="subtle"
                    :theme="item.color"
                    size="md"
                    :label="label"
                  />
                </template>
              </ListRowItem>
            </ListRows>
          </ListView>
          <EmptyState v-else :icon="LeadsIcon" name="Leads" />
        </div>
        <div v-if="tab.label === 'Tickets'" class="flex flex-1 flex-col overflow-hidden">
          <ListView
            v-if="ticketRows.length"
            class="mt-4"
            :columns="ticketColumns"
            :rows="ticketRows"
            :options="{
              getRowRoute: (row) => ({
                name: 'Ticket',
                params: { ticketId: row.name },
              }),
              selectable: false,
              showTooltip: false,
            }"
            row-key="name"
          >
            <ListRows v-slot="{ idx, column, item, row }" :rows="ticketRows" doctype="HD Ticket">
              <ListRowItem :item="item" :align="column.align">
                <template #default="{ label }">
                  <Badge
                    v-if="column.key === 'status' || column.key === 'priority'"
                    variant="subtle"
                    :theme="column.key === 'priority' ? getPriorityColor(label) : 'gray'"
                    size="md"
                    :label="label"
                  />
                </template>
              </ListRowItem>
            </ListRows>
          </ListView>
          <EmptyState v-else :icon="TicketsIcon" name="Tickets" />
        </div>
        <div v-if="tab.label === 'Notes'" class="h-full flex flex-col px-3 sm:px-10">
          <div class="my-3 flex items-center justify-between sm:mb-4 sm:mt-8">
            <div class="text-xl font-semibold text-ink-gray-8">
              {{ __('Notes') }}
            </div>
            <Button
              variant="solid"
              :label="__('New Note')"
              iconLeft="plus"
              @click="showNoteModal = true; editingNote = {}"
            />
          </div>
          <div
            v-if="notes.data?.length"
            class="grid grid-cols-1 gap-4 pb-3 sm:pb-5 lg:grid-cols-2 xl:grid-cols-3"
          >
            <div
              v-for="note in notes.data"
              :key="note.name"
              @click="editingNote = note; showNoteModal = true"
            >
              <NoteArea v-model="notes" :note="note" />
            </div>
          </div>
          <EmptyState v-else :icon="NoteIcon" name="Notes" />
          <NoteModal
            v-model="showNoteModal"
            v-model:reloadNotes="notes"
            :note="editingNote"
            doctype="Contact"
            :doc="contact.doc.name"
          />
        </div>
        <div v-if="tab.label === 'Call Logs'" class="flex flex-1 flex-col overflow-hidden">
          <div v-if="callLogs.data?.length" class="activity mt-4">
            <div v-for="(call, i) in callLogs.data" :key="call.name">
              <div class="activity grid grid-cols-[30px_minmax(auto,_1fr)] gap-4 px-3 sm:px-10">
                <div
                  class="z-0 relative flex justify-center before:absolute before:left-[50%] before:-z-[1] before:top-0 before:border-l before:border-outline-gray-modals"
                  :class="i != callLogs.data.length - 1 ? 'before:h-full' : 'before:h-4'"
                >
                  <div class="flex h-8 w-7 items-center justify-center bg-surface-white text-ink-gray-8">
                    <MissedCallIcon v-if="call.status == 'No Answer'" class="text-ink-red-4" />
                    <DeclinedCallIcon v-else-if="call.status == 'Busy'" />
                    <component :is="call.type == 'Incoming' ? InboundCallIcon : OutboundCallIcon" v-else />
                  </div>
                </div>
                <CallArea class="mb-4" :activity="call" />
              </div>
            </div>
          </div>
          <EmptyState v-else :icon="PhoneIcon" name="Call Logs" />
        </div>
      </template>
    </Tabs>
    <Resizer class="flex flex-col justify-between border-l" side="right">
      <div
        class="flex h-[45px] cursor-copy items-center border-b px-5 py-2.5 text-lg font-medium text-ink-gray-9"
        @click="copyToClipboard(props.contactId)"
      >
        {{ __(props.contactId) }}
      </div>
      <FileUploader
        :validateFile="validateIsImageFile"
        @success="changeContactImage"
      >
        <template #default="{ openFileSelector, error }">
          <div class="flex items-center justify-start gap-5 border-b p-5">
            <div class="group relative size-12">
              <Avatar
                size="3xl"
                class="size-12"
                :label="contact.doc.full_name"
                :image="contact.doc.image"
              />
              <component
                :is="contact.doc.image ? Dropdown : 'div'"
                v-bind="
                  contact.doc.image
                    ? {
                        options: [
                          {
                            icon: 'upload',
                            label: __('Change Image'),
                            onClick: openFileSelector,
                          },
                          {
                            icon: 'trash-2',
                            label: __('Remove Image'),
                            onClick: () => changeContactImage(''),
                          },
                        ],
                      }
                    : { onClick: openFileSelector }
                "
                class="!absolute bottom-0 left-0 right-0"
              >
                <div
                  class="z-1 absolute bottom-0.5 left-0 right-0.5 flex h-9 cursor-pointer items-center justify-center rounded-b-full bg-black bg-opacity-40 pt-3 opacity-0 duration-300 ease-in-out group-hover:opacity-100"
                  style="-webkit-clip-path: inset(12px 0 0 0); clip-path: inset(12px 0 0 0)"
                >
                  <CameraIcon class="size-4 cursor-pointer text-white" />
                </div>
              </component>
            </div>
            <div class="flex flex-col gap-2.5 truncate">
              <div class="truncate text-2xl font-medium text-ink-gray-9">
                <span v-if="contact.doc.salutation">
                  {{ contact.doc.salutation + ' ' }}
                </span>
                <span>{{ contact.doc.full_name }}</span>
              </div>
              <div
                v-if="contact.doc.company_name"
                class="flex items-center gap-1.5 text-base text-ink-gray-8"
              >
                {{ contact.doc.company_name }}
              </div>
              <div class="flex gap-1.5">
                <Button
                  v-if="callEnabled"
                  :tooltip="__('Make a Call')"
                  :icon="PhoneIcon"
                  @click="
                    () =>
                      contact.doc.mobile_no
                        ? makeCall(contact.doc.mobile_no)
                        : toast.error(
                            __('Please set a mobile number to make calls'),
                          )
                  "
                />
                <Button
                  :tooltip="__('Attach a File')"
                  :icon="AttachmentIcon"
                  @click="showFilesUploader = true"
                />
                <Button
                  v-if="canDelete"
                  :tooltip="__('Delete')"
                  variant="subtle"
                  theme="red"
                  icon="trash-2"
                  @click="deleteContact()"
                />
              </div>
              <ErrorMessage :message="__(error)" />
            </div>
          </div>
        </template>
      </FileUploader>
      <div
        v-if="sections.data"
        class="flex flex-1 flex-col justify-between overflow-hidden"
      >
        <SidePanelLayout
          :sections="parsedSections"
          doctype="Contact"
          :docname="contact.doc.name"
          @reload="sections.reload"
        />
      </div>
    </Resizer>
  </div>
  <ErrorPage
    v-else-if="errorTitle"
    :errorTitle="errorTitle"
    :errorMessage="errorMessage"
  />
  <FilesUploader
    v-model="showFilesUploader"
    doctype="Contact"
    :docname="contact.doc.name"
  />
  <DeleteLinkedDocModal
    v-if="showDeleteLinkedDocModal"
    v-model="showDeleteLinkedDocModal"
    :doctype="'Contact'"
    :docname="contact.doc.name"
    name="Contacts"
  />
</template>

<script setup>
import ErrorPage from '@/components/ErrorPage.vue'
import Resizer from '@/components/Resizer.vue'
import Icon from '@/components/Icon.vue'
import SidePanelLayout from '@/components/SidePanelLayout.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import PhoneIcon from '@/components/Icons/PhoneIcon.vue'
import AttachmentIcon from '@/components/Icons/AttachmentIcon.vue'
import CameraIcon from '@/components/Icons/CameraIcon.vue'
import FilesUploader from '@/components/FilesUploader/FilesUploader.vue'
import DealsIcon from '@/components/Icons/DealsIcon.vue'
import LeadsIcon from '@/components/Icons/LeadsIcon.vue'
import TicketsIcon from '@/components/Icons/TicketsIcon.vue'
import NoteIcon from '@/components/Icons/NoteIcon.vue'
import DetailsIcon from '@/components/Icons/DetailsIcon.vue'
import NoteArea from '@/components/Activities/NoteArea.vue'
import NoteModal from '@/components/Modals/NoteModal.vue'
import CallArea from '@/components/Activities/CallArea.vue'
import MissedCallIcon from '@/components/Icons/MissedCallIcon.vue'
import DeclinedCallIcon from '@/components/Icons/DeclinedCallIcon.vue'
import InboundCallIcon from '@/components/Icons/InboundCallIcon.vue'
import OutboundCallIcon from '@/components/Icons/OutboundCallIcon.vue'
import DealsListView from '@/components/ListViews/DealsListView.vue'
import DataFields from '@/components/Activities/DataFields.vue'
import ListRows from '@/components/ListViews/ListRows.vue'
import CustomActions from '@/components/CustomActions.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import {
  formatDate,
  timeAgo,
  validateIsImageFile,
  setupCustomizations,
  copyToClipboard,
} from '@/utils'
import { getView } from '@/utils/view'
import { useDocument } from '@/data/document'
import { getSettings } from '@/stores/settings'
import { getMeta } from '@/stores/meta'
import { globalStore } from '@/stores/global.js'
import { usersStore } from '@/stores/users.js'
import { organizationsStore } from '@/stores/organizations.js'
import { statusesStore } from '@/stores/statuses'
import { showAddressModal, addressProps } from '@/composables/modals'
import { callEnabled } from '@/composables/settings'
import {
  Breadcrumbs,
  Avatar,
  FileUploader,
  Tabs,
  call,
  createResource,
  usePageMeta,
  Dropdown,
  toast,
  Badge,
  ListView,
  ListRowItem,
} from 'frappe-ui'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/ListViews/EmptyState.vue'

const { brand } = getSettings()
const { makeCall, $dialog, $socket } = globalStore()

const { getUser } = usersStore()
const { getOrganization } = organizationsStore()
const { getDealStatus, getLeadStatus } = statusesStore()
const { doctypeMeta } = getMeta('Contact')

const props = defineProps({
  contactId: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()

const errorTitle = ref('')
const errorMessage = ref('')

const {
  document: contact,
  permissions,
  scripts,
} = useDocument('Contact', props.contactId)

const canDelete = computed(() => permissions.data?.permissions?.delete || false)

const breadcrumbs = computed(() => {
  let items = [{ label: __('Contacts'), route: { name: 'Contacts' } }]

  if (route.query.view || route.query.viewType) {
    let view = getView(route.query.view, route.query.viewType, 'Contact')
    if (view) {
      items.push({
        label: __(view.label),
        icon: view.icon,
        route: {
          name: 'Contacts',
          params: { viewType: route.query.viewType },
          query: { view: route.query.view },
        },
      })
    }
  }

  items.push({
    label: title.value,
    route: { name: 'Contact', params: { contactId: props.contactId } },
  })
  return items
})

const title = computed(() => {
  let t = doctypeMeta.value?.title_field || 'name'
  return contact.doc?.[t] || props.contactId
})

usePageMeta(() => {
  return {
    title: title.value,
    icon: brand.favicon,
  }
})
const showDeleteLinkedDocModal = ref(false)
const showFilesUploader = ref(false)
const showNoteModal = ref(false)
const editingNote = ref({})

async function deleteContact() {
  showDeleteLinkedDocModal.value = true
}

function changeContactImage(file) {
  contact.doc.image = file?.file_url || ''
  contact.save.submit(null, {
    onSuccess: () => {
      toast.success(__('Contact image updated'))
    },
  })
}

const tabIndex = ref(0)
const tabs = [
  {
    label: 'Contact Information',
    icon: DetailsIcon,
  },
  {
    label: 'Leads',
    icon: LeadsIcon,
    count: computed(() => leads.data?.length),
  },
  {
    label: 'Tickets',
    icon: TicketsIcon,
    count: computed(() => tickets.data?.length),
  },
  {
    label: 'Notes',
    icon: NoteIcon,
    count: computed(() => notes.data?.length),
  },
  {
    label: 'Call Logs',
    icon: PhoneIcon,
    count: computed(() => callLogs.data?.length),
  },
]

const deals = createResource({
  url: 'crm.api.contact.get_linked_deals',
  cache: ['deals', props.contactId],
  params: { contact: props.contactId },
  auto: true,
})

const leads = createResource({
  url: 'crm.api.contact.get_linked_leads',
  cache: ['leads', props.contactId],
  params: { contact: props.contactId },
  auto: true,
})

const tickets = createResource({
  url: 'crm.api.contact.get_linked_tickets',
  cache: ['tickets', props.contactId],
  params: { contact: props.contactId },
  auto: true,
})

const notes = createResource({
  url: 'crm.api.contact.get_linked_notes',
  cache: ['contact_notes', props.contactId],
  params: { contact: props.contactId },
  auto: true,
})

const callLogs = createResource({
  url: 'kiwi.api.contact.get_linked_call_logs',
  cache: ['contact_call_logs', props.contactId],
  params: { contact: props.contactId },
  auto: true,
})

const rows = computed(() => {
  if (!deals.data || deals.data == []) return []

  return deals.data.map((row) => getDealRowObject(row))
})

const sections = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections',
  cache: ['sidePanelSections', 'Contact'],
  params: { doctype: 'Contact' },
  auto: true,
})

const parsedSections = computed(() => {
  if (!sections.data) return []
  return sections.data.map((section) => ({
    ...section,
    columns: section.columns.map((column) => ({
      ...column,
      fields: column.fields.map((field) => {
        field.label = fieldLabelMap[field.fieldname] || field.label
        field.placeholder =
          fieldPlaceholderMap[field.fieldname] || field.placeholder

        if (field.fieldname === 'email_id' && !section.read_only) {
          return {
            ...field,
            read_only: false,
            fieldtype: 'Dropdown',
            options: (contact.doc?.email_ids || []).map((email) => ({
              name: email.name,
              value: email.email_id,
              selected: email.email_id === contact.doc.email_id,
              placeholder: 'john@doe.com',
              onClick: () => setAsPrimary('email', email.email_id),
              onSave: (option, isNew) =>
                isNew
                  ? createNew('email', option.value)
                  : editOption(
                      'Contact Email',
                      option.name,
                      'email_id',
                      option.value,
                    ),
              onDelete: async (option, isNew) => {
                contact.doc.email_ids = contact.doc.email_ids.filter(
                  (e) => e.name !== option.name,
                )
                if (!isNew) await deleteOption('Contact Email', option.name)
              },
            })),
            create: () => {
              // Add a temporary new option locally (mirrors original behavior)
              contact.doc.email_ids = [
                ...(contact.doc.email_ids || []),
                {
                  name: 'new-1',
                  value: '',
                  selected: false,
                  isNew: true,
                },
              ]
            },
          }
        }
        if (field.fieldname === 'mobile_no' && !section.read_only) {
          return {
            ...field,
            read_only: false,
            fieldtype: 'Dropdown',
            options: (contact.doc?.phone_nos || []).map((phone) => ({
              name: phone.name,
              value: phone.phone,
              selected: phone.phone === contact.doc.mobile_no,
              onClick: () => setAsPrimary('mobile_no', phone.phone),
              onSave: (option, isNew) =>
                isNew
                  ? createNew('phone', option.value)
                  : editOption(
                      'Contact Phone',
                      option.name,
                      'phone',
                      option.value,
                    ),
              onDelete: async (option, isNew) => {
                contact.doc.phone_nos = contact.doc.phone_nos.filter(
                  (p) => p.name !== option.name,
                )
                if (!isNew) await deleteOption('Contact Phone', option.name)
              },
            })),
            create: () => {
              contact.doc.phone_nos = [
                ...(contact.doc.phone_nos || []),
                {
                  name: 'new-1',
                  value: '',
                  selected: false,
                  isNew: true,
                },
              ]
            },
          }
        }
        if (field.fieldname === 'address') {
          return {
            ...field,
            create: (_value, close) => {
              openAddressModal()
              close?.()
            },
            edit: (address) => openAddressModal(address),
          }
        }
        return field
      }),
    })),
  }))
})

const fieldLabelMap = {
  mobile_no: __('Mobile Number'),
  company_name: __('Organization'),
}

const fieldPlaceholderMap = {
  mobile_no: __('Add Mobile Number...'),
  company_name: __('Add Organization...'),
}

async function setAsPrimary(field, value) {
  let d = await call('crm.api.contact.set_as_primary', {
    contact: contact.doc.name,
    field,
    value,
  })
  if (d) {
    contact.reload()
    toast.success(__('Contact Updated'))
  }
}

async function createNew(field, value) {
  if (!value) return
  let d = await call('crm.api.contact.create_new', {
    contact: contact.doc.name,
    field,
    value,
  })
  if (d) {
    contact.reload()
    toast.success(__('Contact Updated'))
  }
}

async function editOption(doctype, name, fieldname, value) {
  let d = await call('frappe.client.set_value', {
    doctype,
    name,
    fieldname,
    value,
  })
  if (d) {
    contact.reload()
    toast.success(__('Contact Updated'))
  }
}

async function deleteOption(doctype, name) {
  await call('frappe.client.delete', {
    doctype,
    name,
  })
  await contact.reload()
  toast.success(__('Contact Updated'))
}

const { getFormattedCurrency } = getMeta('CRM Deal')

const columns = computed(() => dealColumns)

function getDealRowObject(deal) {
  return {
    name: deal.name,
    organization: {
      label: deal.organization,
      logo: getOrganization(deal.organization)?.organization_logo,
    },
    annual_revenue: getFormattedCurrency('annual_revenue', deal),
    status: {
      label: deal.status,
      color: getDealStatus(deal.status)?.color,
    },
    email: deal.email,
    mobile_no: deal.mobile_no,
    deal_owner: {
      label: deal.deal_owner && getUser(deal.deal_owner).full_name,
      ...(deal.deal_owner && getUser(deal.deal_owner)),
    },
    modified: {
      label: formatDate(deal.modified),
      timeAgo: __(timeAgo(deal.modified)),
    },
  }
}

const dealColumns = [
  {
    label: __('Organization'),
    key: 'organization',
    width: '11rem',
  },
  {
    label: __('Amount'),
    key: 'annual_revenue',
    align: 'right',
    width: '9rem',
  },
  {
    label: __('Status'),
    key: 'status',
    width: '10rem',
  },
  {
    label: __('Email'),
    key: 'email',
    width: '12rem',
  },
  {
    label: __('Mobile No.'),
    key: 'mobile_no',
    width: '11rem',
  },
  {
    label: __('Deal Owner'),
    key: 'deal_owner',
    width: '10rem',
  },
  {
    label: __('Last Modified'),
    key: 'modified',
    width: '8rem',
  },
]

// Lead rows and columns
const leadRows = computed(() => {
  if (!leads.data) return []
  return leads.data.map((lead) => ({
    name: lead.name,
    lead_name: lead.lead_name,
    status: {
      label: lead.status,
      color: getLeadStatus(lead.status)?.color,
    },
    email: lead.email,
    mobile_no: lead.mobile_no,
    lead_owner: {
      label: lead.lead_owner && getUser(lead.lead_owner).full_name,
      user: lead.lead_owner,
      ...(lead.lead_owner && getUser(lead.lead_owner)),
    },
    modified: {
      label: formatDate(lead.modified),
      timeAgo: __(timeAgo(lead.modified)),
    },
  }))
})

const leadColumns = [
  { label: __('Name'), key: 'lead_name', width: '12rem' },
  { label: __('Status'), key: 'status', width: '10rem' },
  { label: __('Email'), key: 'email', width: '12rem' },
  { label: __('Mobile No.'), key: 'mobile_no', width: '11rem' },
  { label: __('Lead Owner'), key: 'lead_owner', width: '10rem' },
  { label: __('Last Modified'), key: 'modified', width: '8rem' },
]

// Ticket rows and columns
const ticketRows = computed(() => {
  if (!tickets.data) return []
  return tickets.data.map((ticket) => ({
    name: ticket.name,
    subject: ticket.subject,
    status: { label: ticket.status },
    priority: { label: ticket.priority },
    contact: ticket.contact,
    agent: ticket.agent,
    modified: {
      label: formatDate(ticket.modified),
      timeAgo: __(timeAgo(ticket.modified)),
    },
  }))
})

const ticketColumns = [
  { label: __('ID'), key: 'name', width: '8rem' },
  { label: __('Subject'), key: 'subject', width: '16rem' },
  { label: __('Status'), key: 'status', width: '9rem' },
  { label: __('Priority'), key: 'priority', width: '9rem' },
  { label: __('Last Modified'), key: 'modified', width: '8rem' },
]

function getPriorityColor(priority) {
  const map = { Urgent: 'red', High: 'orange', Medium: 'blue', Low: 'gray' }
  return map[priority] || 'gray'
}

function openAddressModal(_address) {
  showAddressModal.value = true
  addressProps.value = {
    doctype: 'Address',
    address: _address,
  }
}

// Setup custom actions from Form Scripts
watch(
  () => contact.doc,
  async (_doc) => {
    if (scripts.data?.length) {
      let s = await setupCustomizations(scripts.data, {
        doc: _doc,
        $dialog,
        $socket,
        router,
        toast,
        updateField: contact.setValue.submit,
        createToast: toast.create,
        deleteDoc: deleteContact,
        call,
      })
      contact._actions = s.actions || []
    }
  },
  { once: true },
)
</script>

<style scoped>
/* Prevent border on Data Fields even if layout has multiple tabs */
:deep(.border.border-outline-gray-1.rounded-lg) {
  border: none !important;
  border-radius: 0 !important;
}
</style>
