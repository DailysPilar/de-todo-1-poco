
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getProductBySlugFromApi,
  deleteProduct,
} from '@/api/products'
import type { DatabaseProduct } from '@/types/databaseProduct'
import { useAuthStore } from '@/stores/auth'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'
import {
  getProductImagesWithUrls,
  type ProductImageWithUrl,
} from '@/api/productImages'
import { getStoreWhatsAppNumber } from '@/api/settings'
import { buildProductWhatsAppUrl } from '@/lib/whatsapp'

const whatsappNumber = ref<string | null>(null)

const whatsappUrl = computed(() => {
  if (!product.value || !whatsappNumber.value || !product.value.available) {
    return null
  }

  return buildProductWhatsAppUrl(
    whatsappNumber.value,
    product.value,
  )
})
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<DatabaseProduct | null>(null)
const loading = ref(true)
const error = ref('')

const productImages = ref<ProductImageWithUrl[]>([])
const selectedImage = ref(0)

const editDialog = ref(false)
const deleteDialog = ref(false)
const deleting = ref(false)
const deleteError = ref('')

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

const publicationStatus = computed(() => {
  switch (product.value?.status) {
    case 'published':
      return {
        label: 'Publicado',
        color: 'success',
      }

    case 'draft':
      return {
        label: 'Borrador',
        color: 'warning',
      }

    case 'archived':
      return {
        label: 'Archivado',
        color: 'default',
      }

    default:
      return {
        label: 'Sin definir',
        color: 'default',
      }
  }
})

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CU', {
    maximumFractionDigits: 2,
  }).format(value)
}

async function loadProductImages(productId: string) {
  productImages.value = await getProductImagesWithUrls(productId)
  selectedImage.value = 0
}

async function refreshProduct() {
  const rawSlug = route.params.slug
  const slug =
    typeof rawSlug === 'string'
      ? rawSlug
      : Array.isArray(rawSlug)
        ? (rawSlug[0] ?? '')
        : ''

  if (!slug) return

  try {
    const updatedProduct = await getProductBySlugFromApi(slug)
    product.value = updatedProduct

    if (updatedProduct) {
      try {
        await loadProductImages(updatedProduct.id)
      } catch (imageError) {
        console.error('Error cargando fotografías:', imageError)
      }
    }
  } catch (err) {
    console.error('Error refrescando producto:', err)
  }
}

function openDeleteDialog() {
  if (!authStore.isAdmin || !product.value) return

  deleteError.value = ''
  deleteDialog.value = true
}

async function confirmDeleteProduct() {
  if (!authStore.isAdmin || !product.value || deleting.value) {
    return
  }

  deleting.value = true
  deleteError.value = ''

  try {
    await deleteProduct(product.value.id)

    deleteDialog.value = false
    await router.push('/catalogo')
  } catch (deleteFailure) {
    deleteError.value =
      deleteFailure instanceof Error
        ? deleteFailure.message
        : 'No se pudo eliminar el producto.'
  } finally {
    deleting.value = false
  }
}

watch(
  () => route.params.slug,
  async (newSlug, _oldSlug, onCleanup) => {
    let cancelled = false

    onCleanup(() => {
      cancelled = true
    })

    const slug =
      typeof newSlug === 'string'
        ? newSlug
        : Array.isArray(newSlug)
          ? (newSlug[0] ?? '')
          : ''

    if (!slug) {
      product.value = null
      productImages.value = []
      loading.value = false
      return
    }

    loading.value = true
    error.value = ''
    product.value = null
    productImages.value = []
    selectedImage.value = 0

    try {
      const [fetchedProduct, fetchedWhatsapp] = await Promise.all([
        getProductBySlugFromApi(slug),
        getStoreWhatsAppNumber().catch((whatsappErr) => {
          console.error('Error cargando WhatsApp:', whatsappErr)
          return null
        }),
      ])

      if (cancelled) return

      whatsappNumber.value = fetchedWhatsapp
      product.value = fetchedProduct

      if (fetchedProduct) {
        try {
          const images = await getProductImagesWithUrls(fetchedProduct.id)
          if (!cancelled) {
            productImages.value = images
            selectedImage.value = 0
          }
        } catch (imageError) {
          console.error('Error cargando fotografías:', imageError)
        }
      }
    } catch (loadError) {
      if (!cancelled) {
        console.error('Error cargando producto:', loadError)
        error.value =
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar la información del producto.'
      }
    } finally {
      if (!cancelled) {
        loading.value = false
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <v-container class="product-detail py-5 py-md-8">
    <!-- Navegación -->
    <v-btn
      to="/catalogo"
      variant="text"
      color="primary"
      prepend-icon="mdi-arrow-left"
      size="small"
      class="back-button mb-4"
    >
      Volver al catálogo
    </v-btn>

    <!-- Cargando -->
    <div v-if="loading" class="loading-state">
      <v-progress-circular
        indeterminate
        color="primary"
        size="42"
      />

      <span>Cargando producto...</span>
    </div>

    <!-- Error -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      rounded="lg"
    >
      {{ error }}
    </v-alert>

    <!-- Ficha del producto -->
    <v-row
      v-else-if="product"
      class="product-layout"
    >
      <!-- Galería -->
      <v-col cols="12" md="6">
        <div class="product-gallery-wrapper">
          <div class="product-gallery">
            <v-img
              v-if="productImages.length"
              :src="productImages[selectedImage]?.url"
              :alt="product.name"
              width="100%"
              height="350"
              contain
              class="main-product-image"
            />

            <div
              v-else
              class="gallery-placeholder"
            >
              <div class="placeholder-icon">
                <v-icon
                  icon="mdi-image-outline"
                  size="45"
                />
              </div>

              <span>Sin fotografías disponibles</span>
            </div>
          </div>

          <!-- Miniaturas -->
          <div
            v-if="productImages.length > 1"
            class="product-thumbnails"
          >
            <button
              v-for="(image, index) in productImages"
              :key="image.id"
              type="button"
              class="product-thumbnail"
              :class="{
                'product-thumbnail--active':
                  selectedImage === index,
              }"
              :aria-label="`Ver fotografía ${index + 1}`"
              :aria-pressed="selectedImage === index"
              @click="selectedImage = index"
            >
              <v-img
                :src="image.url"
                :alt="`${product.name} - foto ${index + 1}`"
                width="100%"
                height="100%"
                cover
              />
            </button>
          </div>

          <div
            v-if="productImages.length > 1"
            class="gallery-counter"
          >
            <v-icon
              icon="mdi-image-multiple-outline"
              size="15"
            />

            {{ selectedImage + 1 }} de {{ productImages.length }}
            fotografías
          </div>
        </div>
      </v-col>

      <!-- Información -->
      <v-col cols="12" md="6">
        <div class="product-information">
          <!-- Disponibilidad pública -->
          <div class="product-badges">
            <v-chip
              :color="product.available ? 'success' : 'error'"
              variant="tonal"
              size="small"
              :prepend-icon="
                product.available
                  ? 'mdi-check-circle-outline'
                  : 'mdi-close-circle-outline'
              "
            >
              {{ product.available ? 'Disponible' : 'Agotado' }}
            </v-chip>
          </div>

          <!-- Nombre -->
          <h1 class="product-title">
            {{ product.name }}
          </h1>

          <!-- Acciones administrativas -->
          <div
            v-if="authStore.isAdmin"
            class="admin-actions"
          >
            <v-btn
              color="primary"
              variant="tonal"
              rounded="lg"
              size="small"
              prepend-icon="mdi-pencil-outline"
              @click="editDialog = true"
            >
              Editar producto
            </v-btn>

            <v-btn
              color="error"
              variant="text"
              rounded="lg"
              size="small"
              prepend-icon="mdi-trash-can-outline"
              @click="openDeleteDialog"
            >
              Eliminar
            </v-btn>
          </div>

          <!-- Descripción -->
          <p class="product-intro">
            {{
              product.description ||
              'Consulta los detalles de este producto.'
            }}
          </p>

          <!-- Precios -->
          <div class="price-panel">
            <div class="panel-heading">
              <v-icon
                icon="mdi-tag-outline"
                size="18"
                color="primary"
              />

              <h2>Precios disponibles</h2>
            </div>

            <div
              v-if="prices.length"
              class="price-grid"
            >
              <div
                v-for="price in prices"
                :key="price.currency"
                class="price-box"
              >
                <span>{{ price.currency }}</span>

                <strong>
                  {{ formatPrice(price.value) }}
                </strong>
              </div>
            </div>

            <p v-else class="no-price">
              Consultar precio
            </p>
          </div>

          <!-- Configuración exclusiva del administrador -->
          <div
            v-if="authStore.isAdmin"
            class="admin-panel"
          >
            <div class="admin-panel-header">
              <div class="admin-panel-title">
                <v-icon
                  icon="mdi-cog-outline"
                  size="18"
                  color="primary"
                />

                <h2>Visibilidad y configuración</h2>
              </div>

              <v-chip
                color="primary"
                variant="tonal"
                size="x-small"
              >
                Administración
              </v-chip>
            </div>

            <!-- Estado de publicación -->
            <div class="admin-setting-row">
              <div class="admin-setting-info">
                <strong>Estado de publicación</strong>
                <p>Visibilidad en el catálogo</p>
              </div>

              <v-chip
                :color="publicationStatus.color"
                variant="tonal"
                size="small"
              >
                {{ publicationStatus.label }}
              </v-chip>
            </div>

            <v-divider />

            <!-- Disponibilidad -->
            <div class="admin-setting-row">
              <div class="admin-setting-info">
                <strong>Disponible para la venta</strong>
                <p>Indica si hay existencias</p>
              </div>

              <v-chip
                :color="product.available ? 'success' : 'error'"
                variant="tonal"
                size="small"
                :prepend-icon="
                  product.available
                    ? 'mdi-check-circle-outline'
                    : 'mdi-close-circle-outline'
                "
              >
                {{ product.available ? 'Sí' : 'No' }}
              </v-chip>
            </div>

            <v-divider />

            <!-- Destacado -->
            <div class="admin-setting-row">
              <div class="admin-setting-info">
                <strong>Destacar en portada</strong>
                <p>Aparece entre los productos destacados</p>
              </div>

              <v-chip
                :color="product.featured ? 'primary' : 'default'"
                variant="tonal"
                size="small"
                :prepend-icon="
                  product.featured
                    ? 'mdi-star-outline'
                    : 'mdi-minus-circle-outline'
                "
              >
                {{ product.featured ? 'Sí' : 'No' }}
              </v-chip>
            </div>
          </div>

          <!-- Contacto -->
          <v-btn
            color="#19B56B"
            size="large"
            rounded="lg"
            block
            class="whatsapp-button mt-4 text-white"
            prepend-icon="mdi-whatsapp"
            :href="whatsappUrl || undefined"
            :disabled="!whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar por WhatsApp
          </v-btn>
          <p v-if="!whatsappNumber" class="contact-note">
            Las consultas por WhatsApp todavía no están configuradas.
          </p>

          <p
            v-else-if="!product.available"
            class="contact-note"
          >
            Este producto se encuentra agotado.
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Producto no encontrado -->
    <v-alert
      v-else
      type="warning"
      variant="tonal"
      rounded="lg"
    >
      Este producto no está disponible.
    </v-alert>
  </v-container>

  <!-- Confirmación de eliminación -->
  <v-dialog
    v-model="deleteDialog"
    max-width="420"
    persistent
  >
    <v-card
      class="delete-dialog"
      rounded="xl"
      elevation="8"
    >
      <div class="delete-content">
        <div class="delete-icon">
          <v-icon
            icon="mdi-trash-can-outline"
            size="26"
            color="error"
          />
        </div>

        <h2 class="delete-title">
          ¿Eliminar este producto?
        </h2>

        <p class="delete-description">
          Estás a punto de eliminar
          <strong>{{ product?.name }}</strong>.
        </p>

        <p class="delete-warning">
          Esta acción es permanente y no se puede deshacer.
        </p>

        <v-alert
          v-if="deleteError"
          type="error"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mt-3"
        >
          {{ deleteError }}
        </v-alert>
      </div>

      <div class="delete-footer">
        <v-btn
          variant="outlined"
          rounded="lg"
          size="small"
          :disabled="deleting"
          @click="deleteDialog = false"
        >
          Cancelar
        </v-btn>

        <v-btn
          color="error"
          variant="flat"
          rounded="lg"
          size="small"
          prepend-icon="mdi-trash-can-outline"
          :loading="deleting"
          @click="confirmDeleteProduct"
        >
          Sí, eliminar
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Formulario de edición -->
  <ProductFormDialog
    v-if="authStore.isAdmin && product"
    v-model="editDialog"
    :product="product"
    @saved="refreshProduct"
  />
</template>

<style scoped>
/* Página */

.product-detail {
  max-width: 1200px;
  min-height: 70vh;
}

.back-button {
  text-transform: none;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

/* Carga */

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 320px;
  color: #718096;
  font-size: 13px;
}

/* Distribución */

.product-layout {
  margin: -10px;
}

.product-layout > .v-col {
  padding: 10px;
}

/* Galería */

.product-gallery-wrapper {
  width: 100%;
}

.product-gallery {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 350px;
  overflow: hidden;
  background: linear-gradient(145deg, #f7faff, #edf4fc);
  border: 1px solid #e3ebf5;
  border-radius: 16px;
}

.main-product-image {
  border-radius: 15px;
}

.gallery-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 350px;
  color: #94a3b8;
  font-size: 12px;
}

.placeholder-icon {
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  border-radius: 20px;
  color: #a8bdd8;
  background: #e8f1fd;
}

.product-thumbnails {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding: 3px 2px 8px;
  margin-top: 12px;
}

.product-thumbnail {
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 2px solid transparent;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.product-thumbnail :deep(.v-img) {
  width: 100% !important;
  height: 100% !important;
}

.product-thumbnail:hover {
  border-color: #93c5fd;
}

.product-thumbnail--active {
  border-color: #087df1;
  box-shadow: 0 2px 9px rgba(8, 125, 241, 0.14);
}

.gallery-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 9px;
  color: #94a3b8;
  font-size: 11px;
}

/* Información del producto */

.product-information {
  width: 100%;
}

.product-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 12px;
}

.product-title {
  margin: 0;
  color: #082b58;
  font-size: clamp(25px, 2.8vw, 35px);
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: -0.8px;
}

.product-intro {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-line;
}

/* Acciones administrativas */

.admin-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 13px;
}

.admin-actions :deep(.v-btn) {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0;
}

/* Precios */

.price-panel {
  margin-top: 22px;
  padding: 17px 18px;
  border: 1px solid #dceafd;
  border-radius: 14px;
  background: #f0f7ff;
}

.panel-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.panel-heading h2 {
  margin: 0;
  color: #082b58;
  font-size: 13px;
  font-weight: 800;
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
}

.price-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0ebfa;
  border-radius: 10px;
}

.price-box span {
  color: #718096;
  font-size: 11px;
  font-weight: 750;
}

.price-box strong {
  color: #087df1;
  font-size: clamp(14px, 1.6vw, 19px);
  font-weight: 850;
  overflow-wrap: anywhere;
}

.no-price {
  color: #64748b;
  font-size: 13px;
}

/* Panel administrativo */

.admin-panel {
  margin-top: 13px;
  padding: 15px 17px;
  background: #fff;
  border: 1px solid #e6edf5;
  border-radius: 14px;
}

.admin-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
}

.admin-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-panel-title h2 {
  margin: 0;
  color: #082b58;
  font-size: 13px;
  font-weight: 800;
}

.admin-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
}

.admin-setting-info {
  min-width: 0;
}

.admin-setting-info strong {
  display: block;
  color: #334155;
  font-size: 12px;
  font-weight: 750;
}

.admin-setting-info p {
  margin: 3px 0 0;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.4;
}

.admin-setting-row .v-chip {
  flex-shrink: 0;
}

/* WhatsApp */

.whatsapp-button {
  text-transform: none;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
}

.contact-note {
  margin: 10px 0 0;
  color: #94a3b8;
  text-align: center;
  font-size: 11px;
  line-height: 1.5;
}

/* Modal de eliminación */

.delete-dialog {
  overflow: hidden;
  border: 1px solid #fee2e2;
}

.delete-content {
  padding: 22px 24px 14px;
}

.delete-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 14px;
  border-radius: 13px;
  background: #fef2f2;
}

.delete-title {
  margin: 0;
  color: #082b58;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.4px;
}

.delete-description {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.delete-description strong {
  color: #082b58;
}

.delete-warning {
  margin: 9px 0 0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 650;
}

.delete-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 9px;
  padding: 10px 24px 18px;
}

.delete-footer :deep(.v-btn) {
  min-height: 34px;
  text-transform: none;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

/* Responsive */

@media (max-width: 960px) {
  .product-layout {
    margin: -8px;
  }

  .product-layout > .v-col {
    padding: 8px;
  }
}

@media (max-width: 600px) {
  .product-gallery,
  .gallery-placeholder {
    min-height: 280px;
  }

  .main-product-image {
    height: 280px !important;
  }

  .product-thumbnail {
    width: 60px;
    height: 60px;
  }

  .product-title {
    font-size: 27px;
  }

  .price-panel {
    padding: 14px;
  }

  .price-grid {
    gap: 6px;
  }

  .price-box {
    padding: 9px;
  }

  .price-box strong {
    font-size: 14px;
  }

  .product-intro {
    font-size: 12px;
  }

  .admin-panel {
    padding: 12px 14px;
  }

  .admin-setting-row {
    padding: 10px 0;
  }

  .delete-content {
    padding: 18px 18px 10px;
  }

  .delete-footer {
    padding: 10px 18px 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-thumbnail {
    transition: none;
  }
}
</style>
