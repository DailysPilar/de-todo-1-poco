
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  getProductImages,
  uploadProductImage,
  deleteProductImage,
  type ProductImage,
} from '@/api/productImages'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  productId: string
}>()

const authStore = useAuthStore()

interface DisplayImage extends ProductImage {
  previewUrl: string
}

const images = ref<DisplayImage[]>([])
const loading = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

async function loadImages() {
  if (!authStore.isAdmin) return

  loading.value = true
  errorMessage.value = ''

  try {
    const records = await getProductImages(props.productId)

    const results = await Promise.all(
      records.map(async (image) => {
        const { data, error } = await supabase.storage
          .from('product-images')
          .createSignedUrl(image.storage_path, 3600)

        if (error) throw error

        return {
          ...image,
          previewUrl: data.signedUrl,
        }
      }),
    )

    images.value = results
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron cargar las imágenes.'
  } finally {
    loading.value = false
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  if (!files.length) return

  uploading.value = true
  errorMessage.value = ''

  try {
    let nextOrder = images.value.length
      ? Math.max(...images.value.map(image => image.sort_order)) + 1
      : 0

    for (const file of files) {
      await uploadProductImage(
        props.productId,
        file,
        nextOrder++,
      )
    }

    await loadImages()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron subir las imágenes.'
    await loadImages()
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeImage(image: DisplayImage) {
  if (!authStore.isAdmin) return

  if (!window.confirm('¿Eliminar esta fotografía?')) return

  errorMessage.value = ''

  try {
    await deleteProductImage(image)
    await loadImages()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No se pudo eliminar la fotografía.'
  }
}

onMounted(loadImages)
</script>

<template>
  <div class="images-manager">
    <div class="images-heading">
      <div>
        <h3>Fotografías del producto</h3>
        <p>
          Sube imágenes claras y de buena calidad.
          La primera será la fotografía principal.
        </p>
      </div>

      <v-btn
        color="primary"
        variant="tonal"
        rounded="lg"
        prepend-icon="mdi-image-plus"
        :loading="uploading"
        :disabled="!authStore.isAdmin"
        @click="openFilePicker"
      >
        Añadir fotos
      </v-btn>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      hidden
      @change="handleFiles"
    />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-progress-linear
      v-if="loading || uploading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <div v-if="images.length" class="images-grid">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        class="image-item"
      >
        <v-img
          :src="image.previewUrl"
          aspect-ratio="1"
          cover
          rounded="lg"
        />

        <v-chip
          v-if="index === 0"
          class="main-image-chip"
          color="primary"
          size="x-small"
        >
          Principal
        </v-chip>

        <v-btn
          icon="mdi-delete-outline"
          color="error"
          variant="flat"
          size="x-small"
          class="delete-image-btn"
          aria-label="Eliminar fotografía"
          @click="removeImage(image)"
        />
      </div>
    </div>

    <div v-else-if="!loading" class="images-empty">
      <v-icon
        icon="mdi-image-multiple-outline"
        size="46"
        color="grey-lighten-1"
      />
      <strong>Este producto todavía no tiene fotografías</strong>
      <p>Puedes subir varias imágenes JPG, PNG o WebP.</p>
    </div>
  </div>
</template>

<style scoped>
.images-manager {
  background: white;
  border: 1px solid #e7edf5;
  border-radius: 18px;
  padding: 24px;
}

.images-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.images-heading h3 {
  font-size: 16px;
  font-weight: 800;
  color: #082b58;
}

.images-heading p {
  font-size: 12px;
  line-height: 1.6;
  color: #7b8ba3;
  margin-top: 5px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.image-item {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #e5ecf5;
}

.main-image-chip {
  position: absolute;
  top: 8px;
  left: 8px;
}

.delete-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.images-empty {
  min-height: 180px;
  border: 2px dashed #dce7f4;
  border-radius: 14px;
  background: #fafcff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 24px;
}

.images-empty strong {
  font-size: 13px;
  color: #334155;
}

.images-empty p {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 600px) {
  .images-manager {
    padding: 16px;
  }

  .images-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .images-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
