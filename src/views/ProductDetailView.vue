<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'

const route = useRoute()
const productsStore = useProductsStore()

const product = computed(() =>
  productsStore.getProductBySlug(String(route.params.slug)),
)
</script>

<template>
  <v-container class="py-12">
    <template v-if="product">
      <h1 class="text-h4 font-weight-bold">
        {{ product.name }}
      </h1>

      <p class="mt-4">
        {{ product.description }}
      </p>
    </template>

    <v-alert
      v-else
      type="warning"
      variant="tonal"
    >
      Este producto no está disponible.
    </v-alert>

    <v-btn
      to="/catalogo"
      variant="text"
      color="primary"
      class="mt-6"
    >
      <v-icon start icon="mdi-arrow-left" />
      Volver al catálogo
    </v-btn>
  </v-container>
</template>