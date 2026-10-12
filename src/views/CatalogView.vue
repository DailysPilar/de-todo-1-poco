<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/products/ProductCard.vue'
import { useAuthStore } from '@/stores/auth'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'

const route = useRoute()
const productsStore = useProductsStore()

const authStore = useAuthStore()

const productDialog = ref(false)
const productSavedMessage = ref(false)

onMounted(async () => {
  try {
    await productsStore.initialize()
  } catch (error) {
    console.error('Error cargando el catálogo:', error)
  }
})

function openProductDialog() {
  if (!authStore.isAdmin) return

  productDialog.value = true
}

async function onProductSaved() {
  productSavedMessage.value = true

  try {
    await productsStore.fetchProducts()
  } catch (error) {
    console.error('Error actualizando productos:', error)
  }
}

const getSearchFromRoute = () => {
  const value = route.query.q

  return typeof value === 'string' ? value : ''
}

const search = ref(getSearchFromRoute())

watch(
  () => route.query.q,
  () => {
    search.value = getSearchFromRoute()
  },
)

watch(
  () => authStore.isAdmin,
  async () => {
    productsStore.clearProducts()

    try {
      await productsStore.fetchProducts()
    } catch (error) {
      console.error('Error actualizando productos:', error)
    }
  },
)

const selectedCategory = ref<string | null>(null)
const selectedCurrency = ref<string | null>(null)

const currencyOptions = [
  { title: 'Todas las monedas', value: 'all' },
  { title: 'CUP', value: 'CUP' },
  { title: 'USD', value: 'USD' },
  { title: 'EUR', value: 'EUR' },
]

const categoryOptions = computed(() => [
  { title: 'Todas las categorías', value: 'all' },
  ...productsStore.categories.map((category) => ({
    title: category.name,
    value: category.slug,
  })),
])

watch(
  () => route.query.categoria,
  (value) => {
    const slug = Array.isArray(value) ? value[0] : value

    selectedCategory.value =
      typeof slug === 'string' && slug.length > 0
        ? slug
        : null
  },
  { immediate: true },
)

const filteredProducts = computed(() => {
  return productsStore.products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.value.trim().toLowerCase())

    const category = productsStore.categories.find(
      (item) => item.id === product.category_id,
    )

    const matchesCategory =
      !selectedCategory.value ||
      selectedCategory.value === 'all' ||
      category?.slug === selectedCategory.value

    const matchesCurrency =
      !selectedCurrency.value ||
      selectedCurrency.value === 'all' ||
      (selectedCurrency.value === 'CUP' &&
        product.price_cup !== null) ||
      (selectedCurrency.value === 'USD' &&
        product.price_usd !== null) ||
      (selectedCurrency.value === 'EUR' &&
        product.price_eur !== null)

    return (
      matchesSearch &&
      matchesCategory &&
      matchesCurrency
    )
  })
})

function clearFilters() {
  search.value = ''
  selectedCategory.value = null
  selectedCurrency.value = null
}
</script>

<template>
  <v-container class="catalog-page py-10">
    <div class="mb-8">
      <v-chip color="primary" variant="tonal">
        D'todo 1 poco
      </v-chip>

      <h1 class="text-h4 font-weight-bold mt-4">
        Nuestro catálogo
      </h1>

      <p class="text-medium-emphasis mt-2">
        Encuentra lo que necesitas.
        ¡De todo para ti!
      </p>
    </div>

    <v-card
      class="filters-card pa-5 mb-8"
      rounded="xl"
      elevation="0"
    >
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="search"
            label="Buscar productos"
            placeholder="¿Qué estás buscando?"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
          />
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="selectedCategory"
            :items="categoryOptions"
            label="Categoría"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="selectedCurrency"
            :items="currencyOptions"
            label="Moneda"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold">
          Productos
        </h2>

        <span class="text-medium-emphasis text-body-2">
          {{ filteredProducts.length }} resultados
        </span>
      </div>

      <v-btn
        v-if="authStore.isAdmin"
        color="primary"
        variant="flat"
        rounded="lg"
        prepend-icon="mdi-plus"
        @click="openProductDialog"
      >
        Añadir producto
      </v-btn>
    </div>
    <v-alert
      v-if="productsStore.error"
      type="error"
      variant="tonal"
      class="mb-5"
    >
      No se pudo cargar el catálogo.
      {{ productsStore.error }}
    </v-alert>

    <div
      v-if="productsStore.loading"
      class="d-flex justify-center py-12"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="42"
      />
    </div>

    <v-row v-if="!productsStore.loading && !productsStore.error && filteredProducts.length">
      <v-col
        v-for="product in filteredProducts"
        :key="product.id"
        cols="6"
        sm="4"
        md="3"
      >
        <ProductCard :product="product" />
      </v-col>
    </v-row>

    <v-card
      v-else-if="!productsStore.loading && !productsStore.error"
      class="empty-state pa-10 text-center"
      rounded="xl"
      elevation="0"
    >
      <v-icon
        icon="mdi-package-variant-closed"
        size="75"
        color="grey-lighten-1"
      />

      <h3 class="text-h6 font-weight-bold mt-5">
        {{
          productsStore.products.length
            ? 'No encontramos productos'
            : 'Próximamente nuevos productos'
        }}
      </h3>

      <p class="text-medium-emphasis mt-3">
        {{
          productsStore.products.length
            ? 'Prueba con otros filtros o términos de búsqueda.'
            : 'Estamos preparando nuestro catálogo para ti.'
        }}
      </p>

      <v-btn
        v-if="productsStore.products.length"
        color="primary"
        variant="tonal"
        class="mt-5"
        @click="clearFilters"
      >
        Limpiar filtros
      </v-btn>
    </v-card>
  </v-container>
  <!-- Formulario para crear productos -->
  <ProductFormDialog
    v-if="authStore.isAdmin"
    v-model="productDialog"
    @saved="onProductSaved"
  />

  <!-- Confirmación -->
  <v-snackbar
    v-model="productSavedMessage"
    color="success"
    location="bottom right"
    :timeout="3500"
  >
    Producto guardado correctamente en Supabase.

    <template #actions>
      <v-btn
        variant="text"
        @click="productSavedMessage = false"
      >
        Cerrar
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
.catalog-page {
  min-height: 70vh;
}

.filters-card,
.empty-state {
  border: 1px solid #e8edf5;
  background: white;
}
</style>