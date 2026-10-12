
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getCategories, type Category } from '@/api/categories'
import { createProduct } from '@/api/products'
import { useAuthStore } from '@/stores/auth'
import type { ProductInput } from '@/types/databaseProduct'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const authStore = useAuthStore()

const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const categories = ref<Category[]>([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const name = ref('')
const categoryId = ref<string | null>(null)
const description = ref('')
const priceCup = ref<number | null>(null)
const priceUsd = ref<number | null>(null)
const available = ref(true)
const featured = ref(false)
const status = ref<'draft' | 'published'>('draft')

function createSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function resetForm() {
  name.value = ''
  categoryId.value = null
  description.value = ''
  priceCup.value = null
  priceUsd.value = null
  available.value = true
  featured.value = false
  status.value = 'draft'
  errorMessage.value = ''
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return

    resetForm()
    loading.value = true

    try {
      categories.value = await getCategories()
    } catch {
      errorMessage.value = 'No se pudieron cargar las categorías.'
    } finally {
      loading.value = false
    }
  },
)

async function saveProduct() {
  if (!authStore.isAdmin) {
    errorMessage.value = 'No tienes permisos de administrador.'
    return
  }

  if (!name.value.trim() || !categoryId.value) {
    errorMessage.value = 'Indica el nombre y la categoría.'
    return
  }

  if (priceCup.value == null && priceUsd.value == null) {
    errorMessage.value = 'Indica al menos un precio.'
    return
  }

  if (
    (priceCup.value != null && (!Number.isFinite(priceCup.value) || priceCup.value < 0)) ||
    (priceUsd.value != null && (!Number.isFinite(priceUsd.value) || priceUsd.value < 0))
  ) {
    errorMessage.value = 'Los precios deben ser números válidos y no negativos.'
    return
  }

  const slug = createSlug(name.value)

  if (!slug) {
    errorMessage.value = 'Introduce un nombre válido.'
    return
  }

  const product: ProductInput = {
    category_id: categoryId.value,
    name: name.value.trim(),
    slug: `${slug}-${crypto.randomUUID().slice(0, 8)}`,
    description: description.value.trim() || null,
    price_cup: priceCup.value,
    price_usd: priceUsd.value,
    available: available.value,
    featured: featured.value,
    status: status.value,
  }

  saving.value = true
  errorMessage.value = ''

  try {
    await createProduct(product)
    emit('saved')
    dialog.value = false
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No se pudo guardar el producto.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="650" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center pa-5">
        <v-icon
          icon="mdi-package-variant-plus"
          color="primary"
          class="mr-3"
        />
        Añadir producto

        <v-spacer />

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="dialog = false"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-5">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form id="product-form" @submit.prevent="saveProduct">
          <v-text-field
            v-model="name"
            label="Nombre del producto"
            placeholder="Ej. Inversor solar 5 kW"
            variant="outlined"
            :disabled="saving"
            class="mb-2"
          />

          <v-select
            v-model="categoryId"
            :items="categories"
            item-title="name"
            item-value="id"
            label="Categoría"
            variant="outlined"
            :loading="loading"
            :disabled="loading || saving"
            class="mb-2"
          />

          <v-textarea
            v-model="description"
            label="Descripción"
            variant="outlined"
            rows="3"
            :disabled="saving"
            class="mb-2"
          />

          <v-row>
            <v-col cols="12" sm="6">
              <v-number-input
                v-model="priceCup"
                label="Precio en CUP"
                variant="outlined"
                :min="0"
                :disabled="saving"
                control-variant="hidden"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-number-input
                v-model="priceUsd"
                label="Precio en USD"
                variant="outlined"
                :min="0"
                :disabled="saving"
                control-variant="hidden"
              />
            </v-col>
          </v-row>

          <v-switch
            v-model="available"
            label="Producto disponible"
            color="primary"
            hide-details
          />

          <v-switch
            v-model="featured"
            label="Destacar en la portada"
            color="primary"
            hide-details
          />

          <v-select
            v-model="status"
            label="Estado"
            variant="outlined"
            :items="[
              { title: 'Borrador', value: 'draft' },
              { title: 'Publicado', value: 'published' },
            ]"
            class="mt-4"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />

        <v-btn
          variant="text"
          :disabled="saving"
          @click="dialog = false"
        >
          Cancelar
        </v-btn>

        <v-btn
          type="submit"
          form="product-form"
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="loading || !authStore.isAdmin"
        >
          Guardar producto
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
