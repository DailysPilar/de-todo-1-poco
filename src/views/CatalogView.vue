
<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import ProductCard from '@/components/products/ProductCard.vue'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'

const route = useRoute()
const productsStore = useProductsStore()
const authStore = useAuthStore()

const productDialog = ref(false)
const productSavedMessage = ref(false)

const getSearchFromRoute = () => {
  const value = route.query.q
  return typeof value === 'string' ? value : ''
}

const search = ref(getSearchFromRoute())
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
  ...productsStore.categories.map(category => ({
    title: category.name,
    value: category.slug,
  })),
])

const hasActiveFilters = computed(() =>
  Boolean(search.value?.trim()) ||
  Boolean(
    selectedCategory.value &&
    selectedCategory.value !== 'all',
  ) ||
  Boolean(
    selectedCurrency.value &&
    selectedCurrency.value !== 'all',
  ),
)

const filteredProducts = computed(() => {
  const searchTerm = (search.value ?? '').trim().toLowerCase()

  return productsStore.products.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm)

    const category = productsStore.categories.find(
      item => item.id === product.category_id,
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

    return matchesSearch && matchesCategory && matchesCurrency
  })
})

const resultsLabel = computed(() => {
  const count = filteredProducts.value.length
  return `${count} ${count === 1 ? 'producto' : 'productos'}`
})

onMounted(async () => {
  try {
    await productsStore.initialize()
  } catch (error) {
    console.error('Error cargando el catálogo:', error)
  }
})

watch(
  () => route.query.q,
  () => {
    search.value = getSearchFromRoute()
  },
)

watch(
  () => route.query.categoria,
  value => {
    const slug = Array.isArray(value) ? value[0] : value

    selectedCategory.value =
      typeof slug === 'string' && slug.length > 0
        ? slug
        : null
  },
  { immediate: true },
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

function clearFilters() {
  search.value = ''
  selectedCategory.value = null
  selectedCurrency.value = null
}
</script>

<template>
  <div class="catalog-page">
    <v-container>
      <!-- Cabecera -->
      <section class="catalog-hero">
        <div class="hero-content">
          <span class="hero-eyebrow">
            D' TODO 1 POCO / CATÁLOGO
          </span>

          <h1>
            Encuentra lo que necesitas.
          </h1>

          <p>
            Explora nuestros productos y descubre todo
            lo que tenemos para ti.
          </p>

          <div class="hero-detail">
            <v-icon
              icon="mdi-package-variant-closed"
              size="18"
            />
            <span>De todo para ti, en un solo lugar.</span>
          </div>
        </div>

        <div class="hero-decoration" aria-hidden="true">
          <div class="decoration-circle decoration-circle--one" />
          <div class="decoration-circle decoration-circle--two" />
          <v-icon
            icon="mdi-shopping-outline"
            size="100"
          />
        </div>
      </section>

      <!-- Filtros -->
      <section class="filters-card">
        <div class="filters-heading">
          <div class="filters-title">
            <div class="filters-title">
              <div class="filters-icon">
                <v-icon icon="mdi-tune-variant" size="17" />
              </div>

              <h2>Filtrar por nombre o categoría</h2>
            </div>
          </div>

          <v-btn
            v-if="hasActiveFilters"
            variant="text"
            color="primary"
            size="small"
            class="clear-button"
            prepend-icon="mdi-filter-remove-outline"
            @click="clearFilters"
          >
            Limpiar filtros
          </v-btn>
        </div>

        <v-row class="filters-row">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="search"
              label="Buscar productos"
              placeholder="¿Qué estás buscando?"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              class="filter-field"
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              label="Categoría"
              variant="outlined"
              density="comfortable"
              hide-details
              class="filter-field"
            />
          </v-col>
        </v-row>
      </section>

      <!-- Encabezado de resultados -->
      <section class="results-heading">
        <div class="results-title">
          <span class="results-eyebrow">
            EXPLORA NUESTRA TIENDA
          </span>

          <h2>Explorar productos</h2>

          <p>
            {{ resultsLabel }}
            {{ hasActiveFilters ? 'en tu búsqueda' : 'disponibles en el catálogo' }}
          </p>
        </div>

        <v-btn
          v-if="authStore.isAdmin"
          color="primary"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-plus"
          class="add-product-button"
          @click="openProductDialog"
        >
          Añadir producto
        </v-btn>
      </section>

      <!-- Error -->
      <v-alert
        v-if="productsStore.error"
        type="error"
        variant="tonal"
        rounded="lg"
        class="mb-5"
      >
        No se pudo cargar el catálogo.
        {{ productsStore.error }}
      </v-alert>

      <!-- Cargando -->
      <div
        v-if="productsStore.loading"
        class="products-grid"
      >
        <v-skeleton-loader
          v-for="index in 8"
          :key="index"
          type="image, article"
          class="product-skeleton"
        />
      </div>

      <!-- Productos -->
      <v-row
        v-else-if="!productsStore.error && filteredProducts.length"
        class="products-list"
      >
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

      <!-- Sin resultados -->
      <div
        v-else-if="!productsStore.error"
        class="empty-state"
      >
        <div class="empty-icon">
          <v-icon
            :icon="
              productsStore.products.length
                ? 'mdi-magnify-close'
                : 'mdi-package-variant-closed'
            "
            size="38"
          />
        </div>

        <h3>
          {{
            productsStore.products.length
              ? 'No encontramos productos'
              : 'Próximamente nuevos productos'
          }}
        </h3>

        <p>
          {{
            productsStore.products.length
              ? 'Prueba con otros filtros o términos de búsqueda.'
              : 'Estamos preparando nuestro catálogo para ti.'
          }}
        </p>

        <v-btn
          v-if="hasActiveFilters"
          color="primary"
          variant="tonal"
          rounded="lg"
          class="mt-5"
          @click="clearFilters"
        >
          Limpiar filtros
        </v-btn>
      </div>
    </v-container>

    <ProductFormDialog
      v-if="authStore.isAdmin"
      v-model="productDialog"
      @saved="onProductSaved"
    />

    <v-snackbar
      v-model="productSavedMessage"
      color="success"
      location="bottom right"
      :timeout="3500"
    >
      Producto guardado correctamente.

      <template #actions>
        <v-btn
          variant="text"
          @click="productSavedMessage = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.catalog-page {
  min-height: 75vh;
  padding: 32px 0 80px;
  background: #f5f8fc;
}

/* Cabecera */

.catalog-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 215px;
  padding: 34px 40px;
  margin-bottom: 24px;
  overflow: hidden;
  border-radius: 22px;
  background: linear-gradient(
    115deg,
    #082b58 0%,
    #104b8f 65%,
    #087df1 130%
  );
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 650px;
}

.hero-eyebrow {
  display: block;
  margin-bottom: 12px;
  color: #9ac9ff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.hero-content h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(26px, 3vw, 38px);
  font-weight: 850;
  letter-spacing: -1px;
  line-height: 1.2;
}

.hero-content p {
  max-width: 480px;
  margin-top: 12px;
  color: #d3e3f7;
  font-size: 14px;
  line-height: 1.7;
}

.hero-detail {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  color: #ffbf2e;
  font-size: 12px;
  font-weight: 650;
}

.hero-decoration {
  position: absolute;
  right: 65px;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 170px;
  height: 170px;
  color: rgba(255, 255, 255, 0.18);
  transform: translateY(-50%);
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.decoration-circle--one {
  width: 150px;
  height: 150px;
}

.decoration-circle--two {
  width: 215px;
  height: 215px;
}

/* Filtros */

.filters-card {
  padding: 24px;
  margin-bottom: 32px;
  background: #fff;
  border: 1px solid #e5ecf5;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(8, 43, 88, 0.025);
}

.filters-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filters-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #087df1;
  background: #eaf3ff;
}

.filters-title h2 {
  color: #082b58;
  font-size: 15px;
  font-weight: 800;
}

.filters-title p {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
}

.filters-row {
  margin-bottom: -12px;
}

.filter-field :deep(.v-field) {
  border-radius: 12px;
  background: #fbfcff;
}

.filter-field :deep(.v-field:hover) {
  background: #f5f9ff;
}

.clear-button {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0;
}

/* Resultados */

.results-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.results-eyebrow {
  color: #087df1;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.1px;
}

.results-title h2 {
  margin-top: 4px;
  color: #082b58;
  font-size: clamp(23px, 2.8vw, 30px);
  font-weight: 850;
  letter-spacing: -0.7px;
}

.results-title p {
  margin-top: 4px;
  color: #718096;
  font-size: 13px;
}

.add-product-button {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0;
}

.products-list {
  margin-top: 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.product-skeleton {
  border-radius: 16px;
  overflow: hidden;
}

/* Sin resultados */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 45px 20px;
  text-align: center;
  background: #fff;
  border: 1px dashed #d8e5f5;
  border-radius: 18px;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: #f0f6ff;
  color: #087df1;
}

.empty-state h3 {
  margin-top: 20px;
  color: #082b58;
  font-size: 18px;
  font-weight: 800;
}

.empty-state p {
  max-width: 380px;
  margin-top: 8px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 960px) {
  .hero-decoration {
    right: 20px;
    opacity: 0.45;
  }

  .products-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .catalog-page {
    padding: 16px 0 50px;
  }

  .catalog-hero {
    min-height: 190px;
    padding: 26px 22px;
    border-radius: 16px;
    margin-bottom: 16px;
  }

  .hero-content h1 {
    font-size: 27px;
  }

  .hero-content p {
    font-size: 12px;
  }

  .hero-decoration {
    right: -40px;
    opacity: 0.2;
  }

  .filters-card {
    padding: 16px;
    margin-bottom: 26px;
  }

  .filters-heading {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .filters-title h2 {
    font-size: 14px;
  }

  .results-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .results-title h2 {
    font-size: 23px;
  }

  .results-title p {
    font-size: 12px;
  }

  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .filter-field :deep(.v-field) {
    transition: none;
  }
}
</style>
