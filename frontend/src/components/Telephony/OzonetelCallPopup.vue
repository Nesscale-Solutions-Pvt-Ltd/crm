<template>
  <div>
    <!-- Minimized pill -->
    <div
      v-show="showSmallPopup"
      class="ml-2 flex cursor-pointer select-none items-center justify-between gap-1 rounded-full bg-surface-gray-7 px-2 py-[7px] text-base text-ink-gray-2"
      @click="togglePopup"
    >
      <div
        class="flex justify-center items-center size-5 rounded-full bg-surface-gray-6 shrink-0 mr-1"
      >
        <Avatar
          v-if="contact?.image"
          :image="contact.image"
          :label="contact.full_name"
          class="!size-5"
        />
        <AvatarIcon v-else class="size-3" />
      </div>
      <span>{{ contact?.full_name || contact?.mobile_no || phoneNumber }}</span>
      <span>·</span>
      <span>{{ __('Incoming') }}</span>
    </div>

    <!-- Backdrop overlay -->
    <div
      v-show="showPopup"
      class="fixed inset-0 z-40 bg-black/30"
      @click="togglePopup"
    />

    <!-- Centered popup -->
    <div
      v-show="showPopup"
      class="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] flex flex-col gap-4 rounded-xl bg-surface-white p-5 text-ink-gray-9 shadow-2xl border border-outline-gray-2"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Avatar
            v-if="contact?.image"
            :image="contact.image"
            :label="contact.full_name"
            class="!size-9"
          />
          <div
            v-else
            class="flex justify-center items-center size-9 rounded-full bg-surface-gray-2 shrink-0"
          >
            <AvatarIcon class="size-4 text-ink-gray-5" />
          </div>
          <div class="flex flex-col gap-0.5 overflow-hidden">
            <div class="text-base font-semibold leading-5 truncate text-ink-gray-9">
              {{ contact?.full_name || __('Unknown Caller') }}
            </div>
            <div class="text-sm text-ink-gray-5 truncate">
              {{ contact?.mobile_no || phoneNumber }}
            </div>
          </div>
        </div>
        <div class="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            :tooltip="__('Minimize')"
            :icon="MinimizeIcon"
            size="md"
            @click="togglePopup"
          />
          <Button
            variant="ghost"
            icon="x"
            size="md"
            @click="closePopup"
          />
        </div>
      </div>

      <!-- Known Contact View -->
      <div v-if="contact?.name" class="flex flex-col gap-4">
        <!-- Contact details card -->
        <div class="flex items-center gap-3 rounded-lg bg-surface-gray-1 p-3.5">
          <Avatar
            v-if="contact?.image"
            :image="contact.image"
            :label="contact.full_name"
            class="!size-11"
          />
          <div
            v-else
            class="flex justify-center items-center size-11 rounded-full bg-surface-gray-2 shrink-0"
          >
            <AvatarIcon class="size-5 text-ink-gray-5" />
          </div>
          <div class="flex flex-col gap-1 overflow-hidden">
            <div class="text-lg font-semibold leading-6 truncate text-ink-gray-9">
              {{ contact.full_name }}
            </div>
            <div class="text-sm text-ink-gray-6 leading-4 truncate">
              {{ contact.mobile_no || phoneNumber }}
            </div>
            <div
              v-if="contact.email_id"
              class="text-sm text-ink-gray-6 leading-4 truncate"
            >
              {{ contact.email_id }}
            </div>
          </div>
        </div>

        <!-- Quick links -->
        <div class="flex flex-wrap gap-2">
          <Button
            variant="subtle"
            size="md"
            :iconRight="ArrowUpRightIcon"
            :label="__('Open Contact')"
            @click="openContact"
          />
          <Button
            v-if="contact?.deal"
            variant="subtle"
            size="md"
            :iconRight="ArrowUpRightIcon"
            :label="__('Deal')"
            @click="openDeal"
          />
          <Button
            v-if="contact?.lead"
            variant="subtle"
            size="md"
            :iconRight="ArrowUpRightIcon"
            :label="__('Lead')"
            @click="openLead"
          />
        </div>
      </div>

      <!-- Unknown Caller — Create Contact Form -->
      <div v-else class="flex flex-col gap-4">
        <div class="flex items-center gap-3 rounded-lg bg-surface-gray-1 p-3.5">
          <div
            class="flex justify-center items-center size-11 rounded-full bg-surface-gray-2 shrink-0"
          >
            <AvatarIcon class="size-5 text-ink-gray-5" />
          </div>
          <div class="flex flex-col gap-1">
            <div class="text-lg font-semibold leading-6 text-ink-gray-9">
              {{ phoneNumber }}
            </div>
            <div class="text-sm text-ink-gray-5 leading-4">
              {{ __('No matching contact found') }}
            </div>
          </div>
        </div>

        <!-- Inline create form -->
        <div class="flex flex-col gap-3">
          <div class="text-sm font-semibold text-ink-gray-7">
            {{ __('Quick Create Contact') }}
          </div>
          <div class="flex gap-2">
            <FormControl
              v-model="newContact.first_name"
              type="text"
              size="sm"
              :label="__('First Name *')"
              :placeholder="__('First Name')"
              class="flex-1"
            />
            <FormControl
              v-model="newContact.last_name"
              type="text"
              size="sm"
              :label="__('Last Name')"
              :placeholder="__('Last Name')"
              class="flex-1"
            />
          </div>
          <FormControl
            v-model="newContact.email"
            type="text"
            size="sm"
            :label="__('Email')"
            :placeholder="__('email@example.com')"
          />
          <FormControl
            v-model="newContact.phone"
            type="text"
            size="sm"
            :label="__('Phone')"
            disabled
          />
          <ErrorMessage v-if="createError" :message="createError" />
          <Button
            class="w-full"
            variant="solid"
            size="md"
            :label="__('Create Contact')"
            :loading="insertContact.loading"
            @click="createNewContact"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ArrowUpRightIcon from '@/components/Icons/ArrowUpRightIcon.vue'
import AvatarIcon from '@/components/Icons/AvatarIcon.vue'
import MinimizeIcon from '@/components/Icons/MinimizeIcon.vue'
import { Avatar, Button, FormControl, ErrorMessage, createResource, toast } from 'frappe-ui'
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const showPopup = ref(false)
const showSmallPopup = ref(false)

const phoneNumber = ref('')
const createError = ref('')

const contact = ref(null)

const newContact = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
})

const router = useRouter()

function closePopup() {
  showPopup.value = false
  showSmallPopup.value = false
  phoneNumber.value = ''
  contact.value = null
  createError.value = ''
  newContact.first_name = ''
  newContact.last_name = ''
  newContact.email = ''
  newContact.phone = ''
}

const insertContact = createResource({
  url: 'frappe.client.insert',
  onSuccess(doc) {
    toast.success(__('Contact {0} created', [doc.name]))
    router.push({
      name: 'Contact',
      params: { contactId: doc.name },
    })
    closePopup()
  },
  onError(err) {
    createError.value = err.messages?.[0] || __('Failed to create contact')
  },
})

// Listen for screen pop data from the Ozonetel tab via BroadcastChannel
const channel = new BroadcastChannel('ozonetel_screen_pop')
channel.onmessage = (event) => {
  const data = event.data
  console.log('[OzonetelPopup] BroadcastChannel message received:', data)

  phoneNumber.value = data.phone_number || ''

  if (data.contact) {
    contact.value = data.contact
  } else {
    contact.value = null
    // Pre-fill the phone field
    newContact.first_name = ''
    newContact.last_name = ''
    newContact.email = ''
    newContact.phone = phoneNumber.value
  }

  showPopup.value = true
  showSmallPopup.value = false
}

onBeforeUnmount(() => {
  channel.close()
})

function togglePopup() {
  showPopup.value = !showPopup.value
  showSmallPopup.value = !showSmallPopup.value
}

function openContact() {
  if (contact.value?.name) {
    router.push({
      name: 'Contact',
      params: { contactId: contact.value.name },
    })
    closePopup()
  }
}

function openDeal() {
  if (contact.value?.deal) {
    router.push({
      name: 'Deal',
      params: { dealId: contact.value.deal },
    })
    closePopup()
  }
}

function openLead() {
  if (contact.value?.lead) {
    router.push({
      name: 'Lead',
      params: { leadId: contact.value.lead },
    })
    closePopup()
  }
}

function createNewContact() {
  if (!newContact.first_name?.trim()) {
    createError.value = __('First Name is required')
    return
  }
  createError.value = ''

  const doc = {
    doctype: 'Contact',
    first_name: newContact.first_name.trim(),
    last_name: newContact.last_name.trim() || undefined,
    phone_nos: [{ phone: phoneNumber.value, is_primary_mobile_no: 1 }],
  }

  if (newContact.email?.trim()) {
    doc.email_ids = [{ email_id: newContact.email.trim(), is_primary: 1 }]
  }

  insertContact.submit({ doc })
}
</script>
