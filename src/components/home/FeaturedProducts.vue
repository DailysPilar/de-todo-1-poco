
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/products/ProductCard.vue'

const productsStore = useProductsStore()

const loading = ref(false)
const errorMessage = ref('')

const featuredProducts = computed(() =>
  productsStore.products
    .filter(product =>
      product.featured &&
      product.status === 'published' &&
      productsStore.categories.some(
        category =>
          category.id === product.category_id &&
          category.active,
      ),
    )
    .slice(0, 8),
)

onMounted(async () => {
  loading.value = true

  try {
    await productsStore.initialize()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron cargar los productos.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="featured-section">
    <v-container>
    <div class="section-heading">
    <div class="section-heading-text">
        <span class="section-eyebrow">
        SELECCIÓN ESPECIAL
        </span>

        <h2 class="section-title">
        Productos destacados
        </h2>

        <p class="section-description">
        Descubre algunos de nuestros productos seleccionados para ti.
        </p>
    </div>

    <v-btn
        to="/catalogo"
        color="primary"
        variant="text"
        class="view-all"
    >
        Ver catálogo
        <v-icon end icon="mdi-arrow-up-right" />
    </v-btn>
    </div>

      <div v-if="loading" class="loading-grid">
        <v-skeleton-loader
          v-for="index in 4"
          :key="index"
          type="image, article"
          class="rounded-xl"
        />
      </div>

      <v-alert
        v-else-if="errorMessage"
        type="error"
        variant="tonal"
        rounded="lg"
      >
        {{ errorMessage }}
      </v-alert>

      <v-row v-else-if="featuredProducts.length">
        <v-col
          v-for="product in featuredProducts"
          :key="product.id"
          cols="6"
          sm="4"
          md="3"
        >
          <ProductCard :product="product" />
        </v-col>
      </v-row>

      <div v-else class="empty-featured">
        <v-icon
          icon="mdi-star-outline"
          size="45"
          color="grey-lighten-1"
        />

        <h3>Próximamente más productos</h3>

        <p>
          Estamos preparando una selección especial para ti.
        </p>
      </div>
    </v-container>
  </section>
</template>

<style scoped>
.featured-section {
  padding: 16px 0 64px;
  background: #f5f8fc;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-heading-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.section-eyebrow {
  color: #087df1;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.1px;
  line-height: 1.3;
}

.section-title {
  color: #082b58;
  font-size: clamp(23px, 2.8vw, 30px);
  font-weight: 850;
  letter-spacing: -0.7px;
  line-height: 1.2;
  margin: 0;
}

.section-description {
  color: #718096;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
}

.view-all {
  flex-shrink: 0;
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0;
}

.empty-featured {
  padding: 50px 20px;
  text-align: center;
  background: white;
  border: 1px dashed #dce7f4;
  border-radius: 18px;
}

.empty-featured h3 {
  color: #082b58;
  font-size: 17px;
  font-weight: 750;
  margin-top: 14px;
}

.empty-featured p {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 7px;
}

@media (max-width: 600px) {
  .featured-section {
    padding: 12px 0 48px;
  }

  .section-heading {
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 23px;
  }

  .section-description {
    font-size: 12px;
  }

  .view-all {
    font-size: 11px;
    min-width: auto;
    padding: 0 2px;
  }

  .loading-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
