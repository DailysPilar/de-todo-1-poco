
<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const notifications = useNotificationsStore()

const icon = computed(() => {
  switch (notifications.type) {
    case 'success':
      return 'mdi-check-circle-outline'
    case 'error':
      return 'mdi-alert-circle-outline'
    case 'warning':
      return 'mdi-alert-outline'
    default:
      return 'mdi-information-outline'
  }
})

const color = computed(() => {
  switch (notifications.type) {
    case 'success':
      return '#19B56B'
    case 'error':
      return '#E05252'
    case 'warning':
      return '#E6A323'
    default:
      return '#087DF1'
  }
})
</script>

<template>
  <v-snackbar
    v-model="notifications.visible"
    :key="notifications.notificationId"
    location="top end"
    :timeout="notifications.duration"
    color="white"
    elevation="12"
    rounded="xl"
    min-width="300"
    max-width="420"
    class="app-notification"
  >
    <div class="notification-content">
      <div
        class="notification-icon"
        :style="{
          color,
          backgroundColor: `${color}15`,
        }"
      >
        <v-icon :icon="icon" size="24" />
      </div>

      <div class="notification-text">
        <strong>{{ notifications.title }}</strong>
        <span>{{ notifications.message }}</span>
      </div>

      <v-btn
        icon="mdi-close"
        variant="text"
        size="x-small"
        color="grey"
        aria-label="Cerrar notificación"
        @click="notifications.close()"
      />
    </div>

    <div
      class="notification-accent"
      :style="{ backgroundColor: color }"
    />
  </v-snackbar>
</template>

<style scoped>
.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 2px;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
}

.notification-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  min-width: 0;
}

.notification-text strong {
  font-size: 13px;
  font-weight: 800;
  color: #082b58;
}

.notification-text span {
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.notification-accent {
  height: 3px;
  margin-top: 8px;
  border-radius: 6px;
}

:deep(.v-snackbar__content) {
  padding: 12px 16px;
  color: #082b58;
}

@media (max-width: 600px) {
  :deep(.v-snackbar__wrapper) {
    min-width: 0 !important;
    max-width: calc(100vw - 24px) !important;
  }
}
</style>
