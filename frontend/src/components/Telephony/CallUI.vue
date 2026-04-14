<template>
  <TwilioCallUI ref="twilio" />
  <ExotelCallUI ref="exotel" />
  <OzonetelCallPopup />
  <Dialog
    v-model="show"
    :options="{
      title: __('Make Call'),
      actions: [
        {
          label: __('Call using {0}', [callMedium]),
          variant: 'solid',
          onClick: makeCallUsing,
        },
      ],
    }"
  >
    <template #body-content>
      <div class="flex flex-col gap-4">
        <FormControl
          v-model="mobileNumber"
          type="text"
          :label="__('Mobile Number')"
        />
        <FormControl
          v-model="callMedium"
          type="select"
          :label="__('Calling Medium')"
          :options="availableMediums"
        />
        <div class="flex flex-col gap-1">
          <FormControl
            v-model="isDefaultMedium"
            type="checkbox"
            :label="__('Make {0} as default calling medium', [callMedium])"
          />

          <div v-if="isDefaultMedium" class="text-sm text-ink-gray-4">
            {{
              __('You can change the default calling medium from the settings')
            }}
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import TwilioCallUI from '@/components/Telephony/TwilioCallUI.vue'
import ExotelCallUI from '@/components/Telephony/ExotelCallUI.vue'
import OzonetelCallPopup from '@/components/Telephony/OzonetelCallPopup.vue'
import {
  twilioEnabled,
  exotelEnabled,
  ozonetelEnabled,
  defaultCallingMedium,
} from '@/composables/settings'
import { globalStore } from '@/stores/global'
import { FormControl, call, createResource, toast } from 'frappe-ui'
import { computed, nextTick, ref, watch } from 'vue'

const { setMakeCall } = globalStore()

const twilio = ref(null)
const exotel = ref(null)

const callMedium = ref('Twilio')
const isDefaultMedium = ref(false)

const show = ref(false)
const mobileNumber = ref('')

const availableMediums = computed(() => {
  const mediums = []
  if (twilioEnabled.value) mediums.push('Twilio')
  if (exotelEnabled.value) mediums.push('Exotel')
  if (ozonetelEnabled.value) mediums.push('Ozonetel')
  return mediums
})

const enabledCount = computed(() => {
  let count = 0
  if (twilioEnabled.value) count++
  if (exotelEnabled.value) count++
  if (ozonetelEnabled.value) count++
  return count
})

function makeCall(number) {
  if (enabledCount.value > 1 && !defaultCallingMedium.value) {
    mobileNumber.value = number
    show.value = true
    return
  }

  // Auto-select the single enabled medium
  if (twilioEnabled.value) callMedium.value = 'Twilio'
  else if (exotelEnabled.value) callMedium.value = 'Exotel'
  else if (ozonetelEnabled.value) callMedium.value = 'Ozonetel'

  if (defaultCallingMedium.value) {
    callMedium.value = defaultCallingMedium.value
  }

  mobileNumber.value = number
  makeCallUsing()
}

function makeCallUsing() {
  if (isDefaultMedium.value && callMedium.value) {
    setDefaultCallingMedium()
  }

  if (callMedium.value === 'Twilio') {
    twilio.value.makeOutgoingCall(mobileNumber.value)
  }

  if (callMedium.value === 'Exotel') {
    exotel.value.makeOutgoingCall(mobileNumber.value)
  }

  if (callMedium.value === 'Ozonetel') {
    makeOzonetelCall(mobileNumber.value)
  }

  show.value = false
}

function makeOzonetelCall(number) {
  createResource({
    url: 'ozonetel_integration.api.agent.make_a_call',
    params: { to_number: number },
    auto: true,
    onSuccess(data) {
      toast.success(data.message || __('Call initiated'))
    },
    onError(err) {
      toast.error(err.messages?.[0] || __('Failed to initiate call'))
    },
  })
}

async function setDefaultCallingMedium() {
  await call('crm.integrations.api.set_default_calling_medium', {
    medium: callMedium.value,
  })

  defaultCallingMedium.value = callMedium.value
  toast.success(
    __('Default calling medium set successfully to {0}', [callMedium.value]),
  )
}

watch(
  [twilioEnabled, exotelEnabled, ozonetelEnabled],
  ([twilioValue, exotelValue, ozonetelValue]) =>
    nextTick(() => {
      if (twilioValue) {
        twilio.value.setup()
        callMedium.value = 'Twilio'
      }

      if (exotelValue) {
        exotel.value.setup()
        callMedium.value = 'Exotel'
      }

      if (ozonetelValue) {
        callMedium.value = 'Ozonetel'
      }

      if (twilioValue || exotelValue || ozonetelValue) {
        setMakeCall(makeCall)
      }
    }),
  { immediate: true },
)
</script>
