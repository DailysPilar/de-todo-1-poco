<script setup lang="ts">
import HeroBanner from '@/components/home/HeroBanner.vue'
import HomeCategories from '@/components/home/HomeCategories.vue'

import { onMounted } from 'vue'
import { getCategories } from '@/api/categories'

onMounted(async () => {
  try {
    const categories = await getCategories()

    console.log(
      'Categorías cargadas desde Supabase:',
      categories
    )
  } catch (error) {
    console.error(
      'Error al cargar categorías:',
      error
    )
  }
})

</script>

<template>
  <div>
    <HeroBanner />
    <HomeCategories />
  </div>
</template>