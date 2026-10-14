
<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Category } from '@/api/categories'
import { useProductsStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import ProductCard from '@/components/products/ProductCard.vue'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const authStore = useAuthStore()

const productDialog = ref(false)

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

const searchedProducts = computed(() => {
  const searchTerm = (search.value ?? '').trim().toLowerCase()

  return productsStore.products.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm)

    const matchesCurrency =
      !selectedCurrency.value ||
      selectedCurrency.value === 'all' ||
      (selectedCurrency.value === 'CUP' &&
        product.price_cup !== null) ||
      (selectedCurrency.value === 'USD' &&
        product.price_usd !== null) ||
      (selectedCurrency.value === 'EUR' &&
        product.price_eur !== null)

    return matchesSearch && matchesCurrency
  })
})

const activeCategorySlug = computed(() =>
  selectedCategory.value && selectedCategory.value !== 'all'
    ? selectedCategory.value
    : null,
)

const filteredProducts = computed(() =>
  activeCategorySlug.value
    ? searchedProducts.value.filter(
        product =>
          productsStore.getCategoryById(product.category_id)?.slug ===
          activeCategorySlug.value,
      )
    : searchedProducts.value,
)

const categoryCounts = computed(() => {
  const counts = new Map<string, number>()

  for (const product of searchedProducts.value) {
    counts.set(
      product.category_id,
      (counts.get(product.category_id) ?? 0) + 1,
    )
  }

  return counts
})

interface CategorySection {
  key: string
  name: string
  category: Category | null
  products: typeof productsStore.products
}

// Subsecciones sin vacías; los productos sin categoría resoluble van a "Otros"
const categorySections = computed<CategorySection[]>(() => {
  const sections: CategorySection[] = productsStore.categories
    .map(category => ({
      key: category.id,
      name: category.name,
      category,
      products: filteredProducts.value.filter(
        product => product.category_id === category.id,
      ),
    }))
    .filter(section => section.products.length)

  const others = filteredProducts.value.filter(
    product => !productsStore.getCategoryById(product.category_id),
  )

  if (others.length) {
    sections.push({
      key: 'others',
      name: 'Otros',
      category: null,
      products: others,
    })
  }

  return sections
})

const showSections = computed(
  () => !activeCategorySlug.value && productsStore.categories.length > 0,
)

const failedThumbs = reactive(new Set<string>())

function categoryImage(category: Category) {
  return category.image_url || `/images/categories/${category.slug}.jpeg`
}

function selectCategory(slug: string | null) {
  const query = { ...route.query }

  if (slug) {
    query.categoria = slug
  } else {
    delete query.categoria
  }

  router.replace({ query })
}

const resultsLabel = computed(() => {
  const count = filteredProducts.value.length
  return `${count} ${count === 1 ? 'producto' : 'productos'}`
})

const resultsTitle = computed(() => {
  if (activeCategorySlug.value) {
    return (
      productsStore.categories.find(
        category => category.slug === activeCategorySlug.value,
      )?.name ?? 'Productos'
    )
  }

  return search.value?.trim() ? 'Resultados' : 'Todos los productos'
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
  try {
    await productsStore.fetchProducts()
  } catch (error) {
    console.error('Error actualizando productos:', error)
  }
}

function clearFilters() {
  search.value = ''
  selectedCurrency.value = null
  selectCategory(null)
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
            <div class="filters-icon">
              <v-icon icon="mdi-tune-variant" size="17" />
            </div>

            <div class="filters-title-copy">
              <span class="filters-eyebrow">
                FILTROS DEL CATÁLOGO
              </span>

              <h2>Encuentra productos rápidamente</h2>
            </div>
          </div>
        </div>

        <v-row class="filters-row">
          <v-col cols="12">
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
        </v-row>

        <!-- Categorías -->
        <div
          class="category-bar"
          role="group"
          aria-label="Categorías"
        >
          <button
            type="button"
            class="category-pill"
            :class="{ 'category-pill--active': !activeCategorySlug }"
            :aria-pressed="!activeCategorySlug"
            @click="selectCategory(null)"
          >
            <span class="category-thumb category-thumb--all">
              <v-icon icon="mdi-view-grid-outline" size="22" />
            </span>

            <span class="category-pill-label">Todos</span>

            <span class="category-pill-count">
              {{ searchedProducts.length }}
            </span>
          </button>

          <button
            v-for="category in productsStore.categories"
            :key="category.id"
            type="button"
            class="category-pill"
            :class="{
              'category-pill--active':
                activeCategorySlug === category.slug,
            }"
            :aria-pressed="activeCategorySlug === category.slug"
            @click="selectCategory(category.slug)"
          >
            <span class="category-thumb">
              <img
                v-if="!failedThumbs.has(category.id)"
                :src="categoryImage(category)"
                alt=""
                loading="lazy"
                @error="failedThumbs.add(category.id)"
              />
              <v-icon v-else icon="mdi-shape-outline" size="22" />
            </span>

            <span class="category-pill-label">{{ category.name }}</span>

            <span class="category-pill-count">
              {{ categoryCounts.get(category.id) ?? 0 }}
            </span>
          </button>
        </div>
      </section>

      <!-- Encabezado de resultados -->
      <section class="results-heading">
        <div class="results-title">
          <h2>{{ resultsTitle }}</h2>
          <span class="results-count">{{ resultsLabel }}</span>
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

      <!-- Subsecciones por categoría (vista "Todos") -->
      <template
        v-else-if="!productsStore.error && filteredProducts.length && showSections"
      >
        <section
          v-for="section in categorySections"
          :key="section.key"
          class="category-section"
        >
          <header class="category-section-header">
            <span class="category-section-thumb">
              <img
                v-if="section.category && !failedThumbs.has(section.key)"
                :src="categoryImage(section.category)"
                alt=""
                loading="lazy"
                @error="failedThumbs.add(section.key)"
              />
              <v-icon v-else icon="mdi-shape-outline" size="20" />
            </span>

            <div class="category-section-title">
              <h3>{{ section.name }}</h3>
              <span>
                {{ section.products.length }}
                {{ section.products.length === 1 ? 'producto' : 'productos' }}
              </span>
            </div>
          </header>

          <v-row class="products-list">
            <v-col
              v-for="product in section.products"
              :key="product.id"
              cols="6"
              sm="4"
              md="3"
            >
              <ProductCard :product="product" />
            </v-col>
          </v-row>
        </section>
      </template>

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
  </div>
</template>

<style scoped>
.category-bar {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  padding-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.category-pill {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid #d5e3f3;
  border-radius: 999px;
  background: #fff;
  color: #082b58;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.category-pill:hover {
  border-color: #087df1;
}

.category-pill:focus-visible {
  outline: 2px solid #087df1;
  outline-offset: 2px;
}

.category-pill--active {
  border-color: #082b58;
  background: #082b58;
  color: #fff;
}

.category-pill-count {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e8f3fe;
  color: #087df1;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}

.category-pill--active .category-pill-count {
  background: #ffbf2e;
  color: #082b58;
}

.category-thumb {
  display: none;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border: 2px solid #d5e3f3;
  border-radius: 50%;
  background: #e8f3fe;
  color: #087df1;
  transition: border-color 0.2s ease;
}

.category-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-pill--active .category-thumb {
  border-color: #087df1;
}

@media (max-width: 600px) {
  .category-bar {
    gap: 14px;
    margin: 14px -16px 0;
    padding: 4px 16px 6px;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }

  .category-bar::-webkit-scrollbar {
    display: none;
  }

  .category-pill {
    position: relative;
    flex-direction: column;
    gap: 6px;
    width: 68px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    scroll-snap-align: start;
  }

  .category-thumb {
    display: flex;
  }

  .category-pill-label {
    max-width: 100%;
    overflow: hidden;
    font-size: 11px;
    line-height: 1.2;
    text-align: center;
    text-overflow: ellipsis;
    white-space: normal;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .category-pill--active {
    background: transparent;
    color: #087df1;
  }

  .category-pill-count {
    position: absolute;
    top: -2px;
    right: 0;
    min-width: 18px;
    padding: 0 5px;
    border: 2px solid #fff;
    background: #082b58;
    color: #fff;
    font-size: 10px;
  }

  .category-pill--active .category-pill-count {
    background: #087df1;
    color: #fff;
  }
}
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
  min-height: 180px;
  padding: 26px 32px;
  margin-bottom: 20px;
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
  max-width: 560px;
}

.hero-eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #9ac9ff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.hero-content h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(24px, 2.7vw, 34px);
  font-weight: 850;
  letter-spacing: -1px;
  line-height: 1.15;
}

.hero-content p {
  max-width: 480px;
  margin-top: 8px;
  color: #d3e3f7;
  font-size: 13px;
  line-height: 1.55;
}

.hero-detail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 13px;
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
  width: 145px;
  height: 145px;
  color: rgba(255, 255, 255, 0.18);
  transform: translateY(-50%);
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.decoration-circle--one {
  width: 128px;
  height: 128px;
}

.decoration-circle--two {
  width: 185px;
  height: 185px;
}

/* Filtros */

.filters-card {
  padding: 16px 16px 20px;
  margin-bottom: 28px;
  background: #fff;
  border: 1px solid #e5ecf5;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(8, 43, 88, 0.05);
}

.filters-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  margin-bottom: 12px;
  border: 1px solid #e2ecf8;
  border-radius: 12px;
  background: #f5f9ff;
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
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #087df1;
  background: #e2efff;
}

.filters-title-copy {
  min-width: 0;
}

.filters-eyebrow {
  display: block;
  margin-bottom: 2px;
  color: #087df1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.9px;
}

.filters-title h2 {
  color: #082b58;
  font-size: 14px;
  font-weight: 800;
}

.filters-title p {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
}

.filters-row {
  margin: 0 -6px;
}

.filters-row > :deep(.v-col) {
  padding: 6px;
}

.filter-field :deep(.v-field) {
  border-radius: 12px;
  background: #f8fbff;
}

.filter-field :deep(.v-field:hover) {
  background: #f1f7ff;
}



/* Resultados */

.results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.results-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  min-width: 0;
}

.results-title h2 {
  margin: 0;
  color: #082b58;
  font-size: clamp(18px, 2vw, 22px);
  font-weight: 800;
  letter-spacing: -0.4px;
}

.results-count {
  color: #718096;
  font-size: 13px;
  font-weight: 600;
}

.add-product-button {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0;
}

.category-section {
  margin-bottom: 32px;
}

.category-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.category-section-thumb {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #e8f3fe;
  box-shadow: 0 0 0 2px #ffbf2e;
  color: #087df1;
}

.category-section-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-section-title {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.category-section-title h3 {
  margin: 0;
  overflow: hidden;
  color: #082b58;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 800;
  letter-spacing: -0.3px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-section-title span {
  color: #718096;
  font-size: 12px;
  font-weight: 600;
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
    padding: 4px 0 50px;
  }

  .catalog-hero {
    min-height: 164px;
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 14px;
  }

  .hero-content h1 {
    font-size: 24px;
  }

  .hero-content p {
    margin-top: 7px;
    font-size: 11px;
    line-height: 1.45;
  }

  .hero-detail {
    margin-top: 10px;
    font-size: 11px;
  }

  .hero-decoration {
    right: -40px;
    opacity: 0.2;
  }

  .filters-card {
    padding: 14px 14px 18px;
    margin-bottom: 26px;
  }

  .filters-heading {
    align-items: flex-start;
    padding: 10px;
  }

  .filters-title h2 {
    font-size: 13px;
  }

  .filters-eyebrow {
    font-size: 8px;
  }

  .results-heading {
    gap: 8px;
  }

  .results-title h2 {
    font-size: 18px;
  }

  .results-count {
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
