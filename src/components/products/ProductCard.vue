
<script setup lang="ts">
import { computed } from 'vue'
import type { DatabaseProduct } from '@/types/databaseProduct'

const props = defineProps<{
  product: DatabaseProduct
}>()

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

const hasPrice = computed(
  () =>
    props.product.price_cup !== null ||
    props.product.price_usd !== null,
)
</script>

<template>
  <v-card
    class="product-card h-100"
    rounded="xl"
    elevation="0"
    :to="`/producto/${product.slug}`"
  >
    <div class="product-image">
      <div class="image-placeholder">
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

      <v-chip
        v-if="product.status === 'draft'"
        class="status-chip"
        color="warning"
        size="small"
      >
        Borrador
      </v-chip>

      <v-chip
        v-if="product.status === 'archived'"
        class="status-chip"
        color="grey"
        size="small"
      >
        Archivado
      </v-chip>
    </div>

    <v-card-text>
      <h3 class="product-name">
        {{ product.name }}
      </h3>

      <div class="product-prices mt-3">
        <template v-if="hasPrice">
          <div
            v-if="product.price_cup !== null"
            class="product-price"
          >
            {{ formatPrice(product.price_cup) }}
            <span>CUP</span>
          </div>

          <div
            v-if="product.price_usd !== null"
            class="product-price"
          >
            {{ formatPrice(product.price_usd) }}
            <span>USD</span>
          </div>
        </template>

        <div v-else class="consult-price">
          Consultar precio
        </div>
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

.status-chip {
  position: absolute;
  top: 12px;
  right: 12px;
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: #082b58;
  line-height: 1.5;
  min-height: 48px;
}

.product-prices {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 32px;
}

.product-price {
  font-size: 22px;
  font-weight: 800;
  color: #087df1;
}

.product-price span {
  font-size: 13px;
  font-weight: 600;
}

.consult-price {
  font-size: 16px;
  font-weight: 700;
  color: #087df1;
}
</style>
