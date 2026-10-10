
<script setup lang="ts">
import { ref } from 'vue'

interface HomeCategory {
  name: string
  slug: string
  icon: string
  image: string
  background: string
}

const categories: HomeCategory[] = [
  {
    name: 'Ferretería',
    slug: 'ferreteria',
    icon: 'mdi-tools',
    image: '/images/categories/ferreteria.jpeg',
    background: '#EAF3FF',
  },
  {
    name: 'Electrodomésticos',
    slug: 'electrodomesticos',
    icon: 'mdi-washing-machine',
    image: '/images/categories/electrodomesticos.jpeg',
    background: '#FFF0EA',
  },
  {
    name: 'Energía solar',
    slug: 'energia-solar',
    icon: 'mdi-solar-panel',
    image: '/images/categories/energia-solar.jpeg',
    background: '#FFF5DC',
  },
  {
    name: 'Vehículos',
    slug: 'vehiculos',
    icon: 'mdi-motorbike',
    image: '/images/categories/vehiculos.jpeg',
    background: '#EAF8F0',
  },
  {
    name: 'Gasolina y diésel',
    slug: 'gasolina-diesel',
    icon: 'mdi-gas-station',
    image: '/images/categories/gasolina-diesel.jpeg',
    background: '#F1ECFF',
  },
]

const failedImages = ref<string[]>([])

function onImageError(slug: string) {
  if (!failedImages.value.includes(slug)) {
    failedImages.value.push(slug)
  }
}

// Tres imágenes existentes para la tarjeta final.
const moreProductImages = [
  categories[0]!,
  categories[2]!,
  categories[3]!,
]
</script>

<template>
  <section id="categorias" class="categories-section">
    <v-container>
      <!-- Encabezado compacto -->
      <div class="section-heading">
        <div class="section-heading-text">
          <span class="section-eyebrow">
            DESCUBRE NUESTRA TIENDA
          </span>

          <h2 class="section-title">
            Compra por categoría
          </h2>

          <p class="section-description">
            Encuentra fácilmente lo que estás buscando.
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

      <!-- Cuadrícula de seis tarjetas -->
      <div class="category-grid">
        <!-- Cinco categorías principales -->
        <v-card
          v-for="category in categories"
          :key="category.slug"
          :to="{
            path: '/catalogo',
            query: { categoria: category.slug }
          }"
          class="category-card"
          rounded="xl"
          elevation="0"
        >
          <div
            class="category-image-container"
            :style="{ backgroundColor: category.background }"
          >
            <img
              v-if="!failedImages.includes(category.slug)"
              :src="category.image"
              :alt="category.name"
              class="category-image"
              loading="lazy"
              @error="onImageError(category.slug)"
            />

            <v-icon
              v-else
              :icon="category.icon"
              size="48"
              color="#174B9A"
            />
          </div>

          <div class="category-info">
            <h3>{{ category.name }}</h3>

            <v-icon
              icon="mdi-arrow-up-right"
              size="18"
              color="primary"
            />
          </div>
        </v-card>

        <!-- Sexta tarjeta: Más productos -->
        <v-card
          to="/catalogo"
          class="category-card more-products-card"
          rounded="xl"
          elevation="0"
        >
          <div class="category-image-container more-products-visual">
            <div class="stacked-images">
              <div
                v-for="(item, index) in moreProductImages"
                :key="item.slug"
                class="stacked-image"
                :class="`stacked-image-${index + 1}`"
              >
                <img
                  v-if="!failedImages.includes(item.slug)"
                  :src="item.image"
                  :alt="item.name"
                  loading="lazy"
                  @error="onImageError(item.slug)"
                />

                <v-icon
                  v-else
                  :icon="item.icon"
                  color="primary"
                  size="30"
                />
              </div>
            </div>

            <span class="more-products-badge">
              <v-icon icon="mdi-plus" size="14" />
              Explora más
            </span>
          </div>

          <div class="category-info">
            <h3>Más productos</h3>

            <v-icon
              icon="mdi-arrow-up-right"
              size="18"
              color="primary"
            />
          </div>
        </v-card>
      </div>
    </v-container>
  </section>
</template>

<style scoped>
/* Sección general */
.categories-section {
  padding: 28px 0 44px;
  background: #f5f8fc;
  scroll-margin-top: 95px;
}

/* Encabezado */
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

/* Cuadrícula responsive */
.category-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

/* Tarjetas */
.category-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: #fff;
  border: 1px solid #e8edf5;
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  border-color: #b9d8ff;
  box-shadow: 0 12px 28px rgba(8, 43, 88, 0.09);
}

/* Fotografías */
.category-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.35s ease;
}

.category-card:hover .category-image {
  transform: scale(1.06);
}

/* Pie de cada tarjeta */
.category-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex: 1;
  padding: 12px 10px;
  min-height: 56px;
}

.category-info h3 {
  color: #082b58;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.category-info .v-icon {
  flex-shrink: 0;
}

/* Tarjeta especial: Más productos */
.more-products-card {
  border-color: #d5e6fc;
}

.more-products-visual {
  background: linear-gradient(
    135deg,
    #eaf3ff 0%,
    #dbeaff 100%
  );
}

.stacked-images {
  position: relative;
  width: 82%;
  height: 78%;
}

.stacked-image {
  position: absolute;
  top: 8%;
  width: 52%;
  height: 82%;
  padding: 4px;
  border: 2px solid #fff;
  border-radius: 10px;
  background: white;
  box-shadow: 0 5px 15px rgba(8, 43, 88, 0.16);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.stacked-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.stacked-image-1 {
  left: 0;
  transform: rotate(-13deg);
  z-index: 1;
}

.stacked-image-2 {
  right: 0;
  transform: rotate(13deg);
  z-index: 2;
}

.stacked-image-3 {
  left: 24%;
  top: 0;
  transform: rotate(0deg);
  z-index: 3;
}

.more-products-card:hover .stacked-image-1 {
  transform: translateX(-5px) rotate(-18deg);
}

.more-products-card:hover .stacked-image-2 {
  transform: translateX(5px) rotate(18deg);
}

.more-products-card:hover .stacked-image-3 {
  transform: translateY(-4px);
}

.more-products-badge {
  position: absolute;
  z-index: 4;
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 9px;
  border-radius: 20px;
  background: #fff;
  color: #087df1;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 3px 10px rgba(8, 43, 88, 0.1);
}

/* Tabletas: tres columnas */
@media (max-width: 1100px) {
  .category-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .category-info h3 {
    font-size: 13px;
  }
}

/* Móviles: dos columnas */
@media (max-width: 600px) {
  .categories-section {
    padding: 24px 0 36px;
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

  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .category-info {
    padding: 11px 9px;
    min-height: 54px;
  }

  .category-info h3 {
    font-size: 12px;
  }

  .stacked-image {
    border-radius: 7px;
    padding: 3px;
  }

  .more-products-badge {
    font-size: 9px;
    padding: 4px 7px;
    bottom: 5px;
  }
}

/* Accesibilidad */
@media (prefers-reduced-motion: reduce) {
  .category-card,
  .category-image,
  .stacked-image {
    transition: none;
  }
}
</style>
