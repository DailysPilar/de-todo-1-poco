
<template>
  <div class="public-layout">
    <AppHeader />

    <v-main class="public-main">
      <router-view />
    </v-main>

    <AppFooter />
  </div>
</template>


<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initialize().catch((error) => {
    console.error('Error al inicializar sesión:', error)
  })
})
</script>

<style scoped>

.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.public-main {
  flex: 1 0 auto;
  min-width: 0;
}

@media (max-width: 900px) {
  .public-main {
    padding-top: 0 !important;
  }
}

</style>