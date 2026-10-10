<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types/product'

const props = defineProps<{
  product: Product
}>()

const formattedPrice = computed(() => {
  if (props.product.price === null) {
    return 'Consultar precio'
  }

  return new Intl.NumberFormat('es-CU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(props.product.price)
})
</script>

<template>
  <v-card
    class="product-card h-100"
    rounded="xl"
    elevation="0"
    :to="`/producto/${product.slug}`"
  >
    <div class="product-image">
      <v-img
        v-if="product.images.length"
        :src="product.images[0]"
        :alt="product.name"
        height="210"
        cover
      />

      <div v-else class="image-placeholder">
        <v-icon
          icon="mdi-image-outline"
          size="55"
          color="grey-lighten-1"
        />
      </div>

      <v-chip
        v-if="!product.available"
        class="availability-chip"
        color="error"
        size="small"
      >
        Agotado
      </v-chip>
    </div>

    <v-card-text>
      <h3 class="product-name">
        {{ product.name }}
      </h3>

      <div class="product-price mt-3">
        {{ formattedPrice }}

        <span v-if="product.price !== null">
          {{ product.currency }}
        </span>
      </div>

      <v-chip
        class="mt-3"
        :color="product.available ? 'success' : 'error'"
        variant="tonal"
        size="small"
      >
        {{ product.available ? 'Disponible' : 'Agotado' }}
      </v-chip>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-btn
        color="primary"
        variant="tonal"
        block
        rounded="lg"
      >
        Ver detalles
        <v-icon end icon="mdi-arrow-right" />
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.product-card {
  border: 1px solid #e8edf5;
  transition: all 0.25s ease;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(8, 43, 88, 0.08);
}

.product-image {
  position: relative;
  background: #f5f8fc;
}

.image-placeholder {
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.availability-chip {
  position: absolute;
  top: 12px;
  left: 12px;
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: #082b58;
  line-height: 1.5;
  min-height: 48px;
}

.product-price {
  font-size: 22px;
  font-weight: 800;
  color: #087df1;
}

.product-price span {
  font-size: 14px;
  font-weight: 600;
}
</style>