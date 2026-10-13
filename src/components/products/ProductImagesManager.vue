
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
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
const deletingImageId = ref<string | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

let loadRequestId = 0

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback
}

async function loadImages() {
  const requestId = ++loadRequestId

  if (!authStore.isAdmin || !props.productId) {
    images.value = []
    return
  }

  loading.value = true

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

    if (requestId === loadRequestId) {
      images.value = results
    }
  } catch (error) {
    console.error('Error cargando fotografías:', error)
    throw error
  } finally {
    if (requestId === loadRequestId) {
      loading.value = false
    }
  }
}

function openFilePicker() {
  if (
    !authStore.isAdmin ||
    uploading.value ||
    !props.productId
  ) {
    return
  }

  fileInput.value?.click()
}

async function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  if (!files.length || uploading.value) return

  uploading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  let uploadedCount = 0

  try {
    let nextOrder = images.value.length
      ? Math.max(
          ...images.value.map((image) => image.sort_order),
        ) + 1
      : 0

    for (const file of files) {
      console.log('Fotografía seleccionada:', {
        name: file.name,
        type: file.type,
        size: file.size,
      })

      await uploadProductImage(
        props.productId,
        file,
        nextOrder,
      )

      nextOrder++
      uploadedCount++
    }

    successMessage.value =
      uploadedCount === 1
        ? 'Fotografía subida correctamente.'
        : `${uploadedCount} fotografías subidas correctamente.`
  } catch (error) {
    console.error('Error subiendo fotografías:', error)

    errorMessage.value = getErrorMessage(
      error,
      'No se pudieron subir las fotografías.',
    )

    if (uploadedCount > 0) {
      successMessage.value =
        `${uploadedCount} fotografía(s) se subieron correctamente.`
    }
  } finally {
    try {
      await loadImages()
    } catch (error) {
      console.error('Error actualizando galería:', error)

      const message = getErrorMessage(
        error,
        'No se pudo actualizar la galería.',
      )

      errorMessage.value = errorMessage.value
        ? `${errorMessage.value} Además, ${message}`
        : message

      successMessage.value = ''
    }

    uploading.value = false
    input.value = ''
  }
}

async function removeImage(image: DisplayImage) {
  if (
    !authStore.isAdmin ||
    deletingImageId.value !== null ||
    uploading.value
  ) {
    return
  }

  if (!window.confirm('¿Eliminar esta fotografía?')) return

  errorMessage.value = ''
  successMessage.value = ''
  deletingImageId.value = image.id

  try {
    await deleteProductImage(image)
    await loadImages()

    successMessage.value =
      'Fotografía eliminada correctamente.'
  } catch (error) {
    console.error('Error eliminando fotografía:', error)

    errorMessage.value = getErrorMessage(
      error,
      'No se pudo eliminar la fotografía.',
    )
  } finally {
    deletingImageId.value = null
  }
}

watch(
  () => props.productId,
  async () => {
    errorMessage.value = ''
    successMessage.value = ''

    try {
      await loadImages()
    } catch (error) {
      errorMessage.value = getErrorMessage(
        error,
        'No se pudieron cargar las fotografías.',
      )
    }
  },
  { immediate: true },
)
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
        :disabled="
          !authStore.isAdmin ||
          loading ||
          uploading ||
          !props.productId
        "
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
      class="file-input"
      @change="handleFiles"
    />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      rounded="lg"
      closable
      class="mb-4"
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      rounded="lg"
      density="comfortable"
      closable
      class="mb-4"
      @click:close="successMessage = ''"
    >
      {{ successMessage }}
    </v-alert>

    <div
      v-if="uploading"
      class="upload-status mb-4"
    >
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon
          icon="mdi-cloud-upload-outline"
          color="primary"
          size="20"
        />

        <span>Subiendo fotografías...</span>
      </div>

      <v-progress-linear
        indeterminate
        color="primary"
        rounded
        height="5"
      />
    </div>

    <v-progress-linear
      v-else-if="loading"
      indeterminate
      color="primary"
      rounded
      height="4"
      class="mb-4"
    />

    <div
      v-if="images.length"
      class="images-grid"
    >
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
        >
          <template #placeholder>
            <div class="image-placeholder">
              <v-progress-circular
                indeterminate
                color="primary"
                size="26"
                width="2"
              />
            </div>
          </template>

          <template #error>
            <div class="image-placeholder">
              <v-icon
                icon="mdi-image-off-outline"
                color="grey"
                size="30"
              />
            </div>
          </template>
        </v-img>

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
          :loading="deletingImageId === image.id"
          :disabled="
            deletingImageId !== null ||
            uploading ||
            loading
          "
          @click="removeImage(image)"
        />
      </div>
    </div>

    <div
      v-else-if="!loading && !uploading"
      class="images-empty"
    >
      <v-icon
        icon="mdi-image-multiple-outline"
        size="46"
        color="grey-lighten-1"
      />

      <strong>
        Este producto todavía no tiene fotografías
      </strong>

      <p>
        Puedes subir varias imágenes JPG, PNG o WebP.
        Máximo 5 MB por imagen.
      </p>
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

.file-input {
  display: none;
}

.upload-status {
  padding: 12px 14px;
  background: #f5f9ff;
  border: 1px solid #e1ebf8;
  border-radius: 12px;
}

.upload-status span {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
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
  background: #f8fafc;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.main-image-chip {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.delete-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
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
    border-radius: 14px;
  }

  .images-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .images-heading .v-btn {
    width: 100%;
  }

  .images-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .images-empty {
    min-height: 150px;
    padding: 18px 12px;
  }
}

@media (max-width: 360px) {
  .images-grid {
    gap: 8px;
  }

  .images-manager {
    padding: 12px;
  }
}
</style>
