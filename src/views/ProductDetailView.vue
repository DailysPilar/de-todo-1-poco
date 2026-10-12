
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProductBySlugFromApi } from '@/api/products'
import type { DatabaseProduct } from '@/types/databaseProduct'
import { useAuthStore } from '@/stores/auth'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'
import {
  getProductImagesWithUrls,
  type ProductImageWithUrl,
} from '@/api/productImages'

const route = useRoute()
const authStore = useAuthStore()
const editDialog = ref(false)

async function refreshProduct() {
  product.value = await getProductBySlugFromApi(
    String(route.params.slug),
  )

  if (product.value) {
    await loadProductImages(product.value.id)
  }
}
const product = ref<DatabaseProduct | null>(null)
const loading = ref(true)
const error = ref('')
const productImages = ref<ProductImageWithUrl[]>([])
const selectedImage = ref(0)

async function loadProductImages(productId: string) {
  productImages.value = await getProductImagesWithUrls(productId)
  selectedImage.value = 0
}
const prices = computed(() => {
  if (!product.value) return []

  return [
    { currency: 'CUP', value: product.value.price_cup },
    { currency: 'USD', value: product.value.price_usd },
    { currency: 'EUR', value: product.value.price_eur },
  ].filter(
    (item): item is { currency: string; value: number } =>
      item.value !== null,
  )
})

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CU', {
    maximumFractionDigits: 2,
  }).format(value)
}

watch(
  () => route.params.slug,
  async (slug) => {
    loading.value = true
    error.value = ''
    product.value = null

    try {
      product.value = await getProductBySlugFromApi(
        String(slug),
      )
      productImages.value = []

      if (product.value) {
        try {
          await loadProductImages(product.value.id)
        } catch (error) {
          console.error('Error cargando fotografías:', error)
        }
      }
    } catch {
      error.value = 'No pudimos cargar este producto.'
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <v-container class="product-detail py-8 py-md-12">
    <v-btn
      to="/catalogo"
      variant="text"
      color="primary"
      prepend-icon="mdi-arrow-left"
      class="mb-6"
    >
      Volver al catálogo
    </v-btn>

    <div v-if="loading" class="py-12 text-center">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      rounded="lg"
    >
      {{ error }}
    </v-alert>

    <v-row v-else-if="product" class="ga-0">
      <!-- Galería: pendiente de conectar las fotografías -->
      <v-col cols="12" md="6" class="pr-md-6">
        <div class="product-gallery-wrapper">
          <v-card
            class="product-gallery"
            rounded="xl"
            elevation="0"
          >
            <v-img
              v-if="productImages.length"
              :src="productImages[selectedImage]?.url"
              :alt="product.name"
              width="100%"
              height="420"
              contain
              class="main-product-image"
            />

            <template v-else>
              <v-icon
                icon="mdi-image-outline"
                size="90"
                color="grey-lighten-1"
              />
              <span>Sin fotografías disponibles</span>
            </template>
          </v-card>

          <div
            v-if="productImages.length > 1"
            class="product-thumbnails mt-4"
          >
            <button
              v-for="(image, index) in productImages"
              :key="image.id"
              type="button"
              class="product-thumbnail"
              :class="{ 'product-thumbnail--active': selectedImage === index }"
              :aria-label="`Ver fotografía ${index + 1}`"
              @click="selectedImage = index"
            >
              <v-img
                :src="image.url"
                :alt="`${product.name} - foto ${index + 1}`"
                width="80"
                height="80"
                cover
              />
            </button>
          </div>
        </div>
      </v-col>

      <!-- Información -->
      <v-col cols="12" md="6" class="pt-6 pt-md-0">
        <v-chip
          :color="product.available ? 'success' : 'error'"
          variant="tonal"
          size="small"
          class="mb-4"
        >
          {{ product.available ? 'Disponible' : 'Agotado' }}
        </v-chip>

        <v-chip
          v-if="product.status !== 'published'"
          color="warning"
          variant="tonal"
          size="small"
          class="ml-2 mb-4"
        >
          {{ product.status === 'draft' ? 'Borrador' : 'Archivado' }}
        </v-chip>

        <h1 class="product-title">
          {{ product.name }}
        </h1>
        <v-btn
            v-if="authStore.isAdmin"
            color="primary"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-pencil-outline"
            class="mt-4"
            @click="editDialog = true"
          >
            Editar producto
          </v-btn>

        <p class="product-intro mt-4">
          {{ product.description || 'Consulta los detalles de este producto.' }}
        </p>

        <v-card
          class="price-panel mt-7 pa-5"
          rounded="xl"
          elevation="0"
        >
          <div class="section-label mb-4">
            Precios disponibles
          </div>

          <div v-if="prices.length" class="price-list">
            <div
              v-for="price in prices"
              :key="price.currency"
              class="price-item"
            >
              <span class="currency-label">
                {{ price.currency }}
              </span>

              <strong>
                {{ formatPrice(price.value) }}
              </strong>
            </div>
          </div>

          <p v-else class="text-medium-emphasis">
            Consultar precio
          </p>
        </v-card>

        <v-card
          class="details-panel mt-5 pa-5"
          rounded="xl"
          elevation="0"
        >
          <h2 class="section-label mb-4">
            Información del producto
          </h2>

          <div class="detail-row">
            <span>Disponibilidad</span>
            <strong>
              {{ product.available ? 'En existencia' : 'Agotado' }}
            </strong>
          </div>

          <v-divider class="my-3" />

          <div class="detail-row">
            <span>Referencia</span>
            <strong>{{ product.slug }}</strong>
          </div>
        </v-card>

        <v-btn
          color="#19B56B"
          size="x-large"
          rounded="lg"
          block
          class="mt-6 text-white"
          prepend-icon="mdi-whatsapp"
          disabled
        >
          Consultar por WhatsApp
        </v-btn>

        <p class="contact-note mt-3">
          Activaremos las consultas cuando configuremos
          el número de WhatsApp de la tienda.
        </p>
      </v-col>
    </v-row>

    <v-alert
      v-else
      type="warning"
      variant="tonal"
      rounded="lg"
    >
      Este producto no está disponible.
    </v-alert>
  </v-container>
  <ProductFormDialog
  v-if="authStore.isAdmin && product"
  v-model="editDialog"
  :product="product"
  @saved="refreshProduct"
/>
</template>

<style scoped>
.product-detail {
  max-width: 1240px;
}

.product-gallery {
  min-height: 420px;
  background: linear-gradient(145deg, #f5f8fc, #eaf3ff);
  border: 1px solid #e5ecf5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 13px;
}

.product-title {
  color: #082b58;
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.8px;
}

.product-intro {
  color: #64748b;
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-line;
}

.price-panel {
  background: #f5f9ff;
  border: 1px solid #dceafd;
}

.details-panel {
  background: white;
  border: 1px solid #e8edf5;
}

.section-label {
  color: #082b58;
  font-size: 15px;
  font-weight: 750;
}

.price-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.price-item,
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.price-item strong {
  color: #087df1;
  font-size: 24px;
  font-weight: 800;
}

.currency-label {
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.detail-row {
  font-size: 13px;
  color: #64748b;
}

.detail-row strong {
  color: #082b58;
  overflow-wrap: anywhere;
  text-align: right;
}

.contact-note {
  color: #94a3b8;
  text-align: center;
  font-size: 12px;
}

@media (max-width: 600px) {
  .product-gallery {
    min-height: 280px;
  }

  .price-item strong {
    font-size: 20px;
  }
}
.product-gallery-wrapper {
  width: 100%;
}

.main-product-image {
  border-radius: 18px;
}

.product-thumbnails {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px 10px;
}

.product-thumbnail {
  flex-shrink: 0;
  width: 84px;
  height: 84px;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: white;
  padding: 0;
  transition: all 0.2s ease;
}

.product-thumbnail:hover {
  border-color: #93c5fd;
}

.product-thumbnail--active {
  border-color: #087df1;
  box-shadow: 0 3px 12px rgba(8, 125, 241, 0.15);
}
</style>
