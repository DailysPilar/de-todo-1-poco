
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'

export const useNotificationsStore = defineStore(
  'notifications',
  () => {
    const visible = ref(false)
    const title = ref('')
    const message = ref('')
    const type = ref<NotificationType>('success')
    const duration = ref(4000)
    const notificationId = ref(0)

    function notify(
      notificationTitle: string,
      notificationMessage: string,
      notificationType: NotificationType = 'success',
    ) {
      title.value = notificationTitle
      message.value = notificationMessage
      type.value = notificationType
      duration.value = notificationType === 'error' ? 6000 : 4000
      notificationId.value++
      visible.value = true
    }

    function close() {
      visible.value = false
    }

    return {
      visible,
      title,
      message,
      type,
      duration,
      notificationId,
      notify,
      close,
    }
  },
)
