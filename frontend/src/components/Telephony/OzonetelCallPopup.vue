<template>
  <div />
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Listen for screen pop data from the Ozonetel tab via BroadcastChannel
const channel = new BroadcastChannel('ozonetel_screen_pop')
channel.onmessage = (event) => {
  const data = event.data
  console.log('[OzonetelPopup] BroadcastChannel message received:', data)

  if (data.contact_id) {
    router.push({
      name: 'Contact',
      params: { contactId: data.contact_id },
    })
  }
}

onBeforeUnmount(() => {
  channel.close()
})
</script>
