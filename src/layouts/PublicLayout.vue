
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

</style>