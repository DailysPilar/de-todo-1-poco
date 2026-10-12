
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DatabaseProduct } from '@/types/databaseProduct'
import { getProductMainImageUrl } from '@/api/productImages'

const props = defineProps<{
  product: DatabaseProduct
}>()

const imageUrl = ref<string | null>(null)

watch(
  () => props.product.id,
  async (productId, _oldId, onCleanup) => {
    let cancelled = false

    onCleanup(() => {
      cancelled = true
    })

    imageUrl.value = null

    try {
      const url = await getProductMainImageUrl(productId)

      if (!cancelled) {
        imageUrl.value = url
      }
    } catch (error) {
      console.error('Error cargando imagen:', error)
    }
  },
  { immediate: true },
)

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

interface DisplayPrice {
  value: number
  currency: 'CUP' | 'USD' | 'EUR'
}

const prices = computed<DisplayPrice[]>(() => {
  const result: DisplayPrice[] = []

  if (props.product.price_cup !== null) {
    result.push({
      value: props.product.price_cup,
      currency: 'CUP',
    })
  }

  if (props.product.price_usd !== null) {
    result.push({
      value: props.product.price_usd,
      currency: 'USD',
    })
  }

  if (props.product.price_eur !== null) {
    result.push({
      value: props.product.price_eur,
      currency: 'EUR',
    })
  }

  return result
})

const mainPrice = computed(() => prices.value[0] ?? null)
const secondaryPrices = computed(() => prices.value.slice(1))
</script>

<template>
  <v-card
    class="product-card"
    rounded="xl"
    elevation="0"
    :to="`/producto/${product.slug}`"
  >
    <!-- Fotografía -->
    <div class="product-image">
      <v-img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="product.name"
        cover
        class="product-photo"
      />

      <div v-else class="image-placeholder">
        <v-icon
          icon="mdi-image-outline"
          size="48"
          color="grey-lighten-1"
        />
      </div>

      <v-chip
        v-if="product.status === 'draft'"
        class="status-chip"
        color="warning"
        size="x-small"
      >
        Borrador
      </v-chip>

      <v-chip
        v-else-if="product.status === 'archived'"
        class="status-chip"
        color="grey"
        size="x-small"
      >
        Archivado
      </v-chip>
    </div>

    <!-- Información -->
    <div class="product-content">
      <!-- Disponibilidad -->
      <div
        class="availability"
        :class="{
          'availability--unavailable': !product.available,
        }"
      >
        <span class="availability-dot" />

        <span>
          {{ product.available ? 'Disponible' : 'Agotado' }}
        </span>
      </div>

      <!-- Nombre -->
      <h3 class="product-name" :title="product.name">
        {{ product.name }}
      </h3>

      <!-- Precios -->
      <div class="price-section">
        <template v-if="mainPrice">
          <div class="main-price">
            <span class="main-price-value">
              {{ formatPrice(mainPrice.value) }}
            </span>

            <span class="main-price-currency">
              {{ mainPrice.currency }}
            </span>
          </div>

          <div
            v-if="secondaryPrices.length"
            class="secondary-prices"
          >
            <span class="secondary-label">
              También:
            </span>

            <span
              v-for="price in secondaryPrices"
              :key="price.currency"
              class="secondary-price"
            >
              {{ formatPrice(price.value) }}
              {{ price.currency }}
            </span>
          </div>
        </template>

        <div v-else class="consult-price">
          Consultar precio
        </div>
      </div>

      <!-- Acción -->
      <div class="product-action">
        <span>Ver detalles</span>

        <v-icon
          icon="mdi-arrow-up-right"
          size="18"
        />
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid #e5ecf5;
  background: #fff;
  text-decoration: none;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: #bfd8f7;
  box-shadow: 0 12px 30px rgba(8, 43, 88, 0.09);
}

/* Fotografía */

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f5f8fc;
}

.product-photo {
  width: 100%;
  height: 100%;
  transition: transform 0.35s ease;
}

.product-card:hover .product-photo {
  transform: scale(1.04);
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.status-chip {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

/* Contenido */

.product-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
  padding: 16px;
}

/* Disponibilidad */

.availability {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  color: #16a34a;
  font-size: 11px;
  font-weight: 650;
}

.availability-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #22c55e;
}

.availability--unavailable {
  color: #dc2626;
}

.availability--unavailable .availability-dot {
  background: #ef4444;
}

/* Nombre */

.product-name {
  color: #082b58;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.4;
  letter-spacing: -0.2px;
  margin: 0;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;

  min-height: 42px;
}

/* Precios */

.price-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.main-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.main-price-value {
  color: #082b58;
  font-size: clamp(19px, 2vw, 25px);
  font-weight: 850;
  letter-spacing: -0.7px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.main-price-currency {
  color: #087df1;
  font-size: 11px;
  font-weight: 750;
}

.secondary-prices {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  min-width: 0;
}

.secondary-label {
  color: #94a3b8;
  font-size: 11px;
}

.secondary-price {
  color: #64748b;
  font-size: 11px;
  font-weight: 650;
}

.consult-price {
  color: #087df1;
  font-size: 16px;
  font-weight: 750;
}

/* Botón visual */

.product-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  margin-top: auto;
  padding: 9px 12px;
  border-radius: 10px;
  background: #082b58;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.product-card:hover .product-action {
  background: #087df1;
}

@media (max-width: 600px) {
  .product-content {
    padding: 12px;
    gap: 8px;
  }

  .product-name {
    font-size: 13px;
    min-height: 37px;
  }

  .main-price-value {
    font-size: 20px;
  }

  .main-price-currency {
    font-size: 10px;
  }

  .secondary-price,
  .secondary-label {
    font-size: 10px;
  }

  .product-action {
    min-height: 38px;
    font-size: 11px;
    padding: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-card,
  .product-photo,
  .product-action {
    transition: none;
  }
}
</style>
