
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getCategories, type Category } from '@/api/categories'
import { createProduct, updateProduct } from '@/api/products'
import { getCurrencySettings } from '@/api/settings'
import { useAuthStore } from '@/stores/auth'
import type {
  DatabaseProduct,
  ProductInput,
  ProductStatus,
} from '@/types/databaseProduct'
import ProductImagesManager from '@/components/products/ProductImagesManager.vue'
type Currency = 'CUP' | 'USD' | 'EUR'

const props = defineProps<{
  modelValue: boolean
  product?: DatabaseProduct | null
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

const editing = computed(() => Boolean(props.product?.id))

const categories = ref<Category[]>([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const ratesReady = ref(false)

const name = ref('')
const categoryId = ref<string | null>(null)
const description = ref('')
const available = ref(true)
const featured = ref(false)
const status = ref<ProductStatus>('draft')

const rates = ref<Record<Currency, number>>({
  CUP: 1,
  USD: 0,
  EUR: 0,
})

const prices = ref<Record<Currency, string>>({
  CUP: '',
  USD: '',
  EUR: '',
})

const accepted = ref<Record<Currency, boolean>>({
  CUP: true,
  USD: true,
  EUR: true,
})

const currencies: Currency[] = ['CUP', 'USD', 'EUR']

const currencyNames: Record<Currency, string> = {
  CUP: 'Peso cubano',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
}

const statusOptions = [
  { title: 'Borrador', value: 'draft' },
  { title: 'Publicado', value: 'published' },
  { title: 'Archivado', value: 'archived' },
]

const selectedCategoryName = computed(
  () => categories.value.find(
    (category) => category.id === categoryId.value,
  )?.name,
)

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toInput(value: number | null | undefined) {
  return value == null ? '' : String(value)
}

function resetForm() {
  name.value = props.product?.name ?? ''
  categoryId.value = props.product?.category_id ?? null
  description.value = props.product?.description ?? ''
  available.value = props.product?.available ?? true
  featured.value = props.product?.featured ?? false
  status.value = props.product?.status ?? 'draft'

  const existing = {
    CUP: props.product?.price_cup,
    USD: props.product?.price_usd,
    EUR: props.product?.price_eur,
  }

  for (const currency of currencies) {
    prices.value[currency] = toInput(existing[currency])
    accepted.value[currency] = props.product
      ? existing[currency] != null
      : true
  }

  errorMessage.value = ''
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return

    resetForm()
    loading.value = true
    ratesReady.value = false

    try {
      const [categoryData, settings] = await Promise.all([
        getCategories(),
        getCurrencySettings(),
      ])

      categories.value = categoryData

      rates.value = {
        CUP: 1,
        USD: Number(settings.usd_to_cup),
        EUR: Number(settings.eur_to_cup),
      }

      ratesReady.value =
        rates.value.USD > 0 &&
        rates.value.EUR > 0
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los datos del formulario.'
    } finally {
      loading.value = false
    }
  },
)

function updatePrice(currency: Currency, value: string) {
  prices.value[currency] = value

  if (!ratesReady.value || !accepted.value[currency]) {
    return
  }

  if (value.trim() === '') {
    // No convertir un campo vacío en un precio cero.
    return
  }

  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) return

  const cupAmount = amount * rates.value[currency]

  for (const target of currencies) {
    if (target === currency || !accepted.value[target]) continue

    prices.value[target] = String(
      Math.round(
        (cupAmount / rates.value[target] + Number.EPSILON) * 100,
      ) / 100,
    )
  }
}

function toggleCurrency(currency: Currency, enabled: boolean) {
  accepted.value[currency] = enabled

  if (!enabled) {
    prices.value[currency] = ''
  }
}

function formatRate(value: number) {
  return new Intl.NumberFormat('es-CU', {
    maximumFractionDigits: 4,
  }).format(value)
}

async function saveProduct() {
  if (!authStore.isAdmin) return

  errorMessage.value = ''

  if (!ratesReady.value || loading.value) {
    errorMessage.value = 'No se ha cargado la configuración de monedas.'
    return
  }

  if (!name.value.trim() || !categoryId.value) {
    errorMessage.value = 'Completa el nombre y la categoría.'
    return
  }

  const slug = slugify(name.value)

  if (!slug) {
    errorMessage.value = 'Introduce un nombre válido.'
    return
  }

  const parsed: Record<Currency, number | null> = {
    CUP: null,
    USD: null,
    EUR: null,
  }

  for (const currency of currencies) {
    if (!accepted.value[currency]) continue

    const raw = prices.value[currency].trim()

    if (!raw) continue

    const amount = Number(raw)

    if (!Number.isFinite(amount) || amount < 0) {
      errorMessage.value = `El precio en ${currency} no es válido.`
      return
    }

    parsed[currency] = amount
  }

  if (Object.values(parsed).every((price) => price === null)) {
    errorMessage.value = 'Indica al menos un precio aceptado.'
    return
  }

  const payload: ProductInput = {
    name: name.value.trim(),
    category_id: categoryId.value,
    slug: props.product?.slug ??
      `${slug}-${crypto.randomUUID().slice(0, 8)}`,
    description: description.value.trim() || null,
    price_cup: parsed.CUP,
    price_usd: parsed.USD,
    price_eur: parsed.EUR,
    available: available.value,
    featured: featured.value,
    status: status.value,
  }

  saving.value = true

  try {
    if (props.product) {
      await updateProduct(props.product.id, payload)
    } else {
      await createProduct(payload)
    }

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
  <v-dialog v-model="dialog" max-width="800" scrollable>
    <v-card class="editor-card" rounded="xl">
      <div class="editor-header">
        <div class="editor-heading">
          <div class="editor-icon">
            <v-icon
              :icon="editing ? 'mdi-pencil-outline' : 'mdi-package-variant-plus'"
              size="25"
            />
          </div>

          <div>
            <h2>{{ editing ? 'Editar producto' : 'Nuevo producto' }}</h2>
            <p>Gestiona la información de tu tienda.</p>
          </div>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar formulario"
          :disabled="saving"
          @click="dialog = false"
        />
      </div>

      <v-divider />

      <v-card-text class="editor-body">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          rounded="lg"
          class="mb-5"
        >
          {{ errorMessage }}
        </v-alert>

        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-5"
        />

        <v-form id="product-editor-form" @submit.prevent="saveProduct">
          <section class="editor-section">
            <div class="section-title">
              <v-icon icon="mdi-text-box-outline" color="primary" />
              <div>
                <h3>Información principal</h3>
                <p>Describe claramente lo que estás vendiendo.</p>
              </div>
            </div>

            <label class="field-label">Nombre del producto *</label>
            <v-text-field
              v-model="name"
              placeholder="Ej. Inversor solar híbrido de 5 kW"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              :disabled="saving || loading"
              class="mb-5"
            />

            <label class="field-label">Categoría *</label>
            <v-select
              v-model="categoryId"
              :items="categories"
              item-title="name"
              item-value="id"
              placeholder="Selecciona una categoría"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              :disabled="saving || loading"
              class="mb-5"
            />

            <label class="field-label">Descripción</label>
            <v-textarea
              v-model="description"
              placeholder="Características, especificaciones, ventajas, estado y todo lo que el cliente necesita saber..."
              variant="outlined"
              density="comfortable"
              rounded="lg"
              rows="5"
              auto-grow
              hide-details
              :disabled="saving || loading"
            />

            <p class="field-help mt-2">
              Una descripción detallada ayuda a resolver dudas antes de contactar.
            </p>
          </section>
          <ProductImagesManager
            v-if="editing && product"
            :key="product.id"
            :product-id="product.id"
            class="mb-5"
          />

          <v-alert
            v-else
            type="info"
            variant="tonal"
            rounded="lg"
            class="mb-5"
          >
            Primero guarda el producto. Después podrás editarlo
            para añadir sus fotografías.
          </v-alert>

          <section class="editor-section">
            <div class="section-title">
              <v-icon icon="mdi-cash-multiple" color="primary" />
              <div>
                <h3>Precios y monedas</h3>
                <p>Introduce un precio y calcula automáticamente los demás.</p>
              </div>
            </div>

            <div class="exchange-banner mb-5">
              <v-icon icon="mdi-swap-horizontal" size="21" />
              <div>
                <strong>Tasas configuradas</strong>
                <p>
                  1 USD = {{ formatRate(rates.USD) }} CUP
                  <span class="rate-separator">·</span>
                  1 EUR = {{ formatRate(rates.EUR) }} CUP
                </p>
              </div>
            </div>

            <v-row>
              <v-col
                v-for="currency in currencies"
                :key="currency"
                cols="12"
                sm="4"
              >
                <div
                  class="currency-card"
                  :class="{ 'currency-card--disabled': !accepted[currency] }"
                >
                  <div class="currency-heading">
                    <div>
                      <strong>{{ currency }}</strong>
                      <p>{{ currencyNames[currency] }}</p>
                    </div>

                    <v-switch
                      :model-value="accepted[currency]"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="saving || loading"
                      :aria-label="`Aceptar ${currency}`"
                      @update:model-value="
                        toggleCurrency(currency, Boolean($event))
                      "
                    />
                  </div>

                  <v-text-field
                    :model-value="prices[currency]"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details
                    :suffix="currency"
                    :disabled="!accepted[currency] || saving || loading"
                    @update:model-value="
                      updatePrice(currency, String($event ?? ''))
                    "
                  />
                </div>
              </v-col>
            </v-row>

            <div class="helper-note mt-4">
              <v-icon icon="mdi-information-outline" size="19" />
              <span>
                Modificar un precio recalcula las otras monedas activas.
                Desactiva las que no aceptes. Los precios existentes no
                cambian al abrir el editor.
              </span>
            </div>
          </section>

          <section class="editor-section">
            <div class="section-title">
              <v-icon icon="mdi-storefront-outline" color="primary" />
              <div>
                <h3>Publicación y visibilidad</h3>
                <p>Decide cómo aparecerá el producto en la tienda.</p>
              </div>
            </div>

            <label class="field-label">Estado del producto</label>
            <v-select
              v-model="status"
              :items="statusOptions"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              :disabled="saving || loading"
              class="mb-5"
            />

            <div class="setting-row">
              <div>
                <strong>Disponible para la venta</strong>
                <p>Indica si tienes existencias actualmente.</p>
              </div>
              <v-switch
                v-model="available"
                color="primary"
                hide-details
                :disabled="saving || loading"
              />
            </div>

            <v-divider class="my-4" />

            <div class="setting-row">
              <div>
                <strong>Destacar en portada</strong>
                <p>Promociona el producto en la página principal cuando esté publicado.</p>
              </div>
              <v-switch
                v-model="featured"
                color="primary"
                hide-details
                :disabled="saving || loading"
              />
            </div>

            <div class="publication-summary mt-5">
              <v-icon icon="mdi-check-decagram-outline" color="primary" />
              <span>
                {{ name.trim() || 'Nuevo producto' }}
                <template v-if="selectedCategoryName">
                  · {{ selectedCategoryName }}
                </template>
                · {{ status === 'published' ? 'Visible públicamente' : 'No visible públicamente' }}
              </span>
            </div>
          </section>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="editor-footer">
        <v-btn
          variant="text"
          rounded="lg"
          :disabled="saving"
          @click="dialog = false"
        >
          Cancelar
        </v-btn>

        <v-btn
          type="submit"
          form="product-editor-form"
          color="#087df1"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-content-save-outline"
          :loading="saving"
          :disabled="loading || !authStore.isAdmin"
        >
          {{ editing ? 'Guardar cambios' : 'Crear producto' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.editor-card {
  background: #fff;
}

.editor-header,
.editor-heading {
  display: flex;
  align-items: center;
}

.editor-header {
  justify-content: space-between;
  gap: 12px;
  padding: 24px 28px;
}

.editor-heading {
  gap: 14px;
}

.editor-icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  background: #eaf3ff;
  color: #087df1;
  border-radius: 15px;
}

.editor-heading h2 {
  font-size: 21px;
  font-weight: 800;
  color: #082b58;
  letter-spacing: -0.5px;
}

.editor-heading p,
.section-title p,
.setting-row p {
  color: #7b8ba3;
  font-size: 12px;
  line-height: 1.6;
  margin-top: 3px;
}

.editor-body {
  padding: 26px 28px !important;
  background: #f8fafd;
}

.editor-section {
  background: #fff;
  border: 1px solid #e7edf5;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 25px;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 800;
  color: #082b58;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 9px;
}

.field-help {
  font-size: 12px;
  color: #94a3b8;
}

.exchange-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-radius: 13px;
  background: #edf6ff;
  color: #087df1;
}

.exchange-banner strong {
  font-size: 13px;
}

.exchange-banner p {
  font-size: 12px;
  color: #475569;
  margin-top: 3px;
}

.rate-separator {
  padding: 0 6px;
}

.currency-card {
  height: 100%;
  padding: 15px;
  border: 1px solid #dce7f4;
  border-radius: 14px;
  background: #fbfdff;
  transition: opacity 0.2s;
}

.currency-card--disabled {
  opacity: 0.55;
  background: #f5f5f5;
}

.currency-heading,
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.currency-heading {
  margin-bottom: 15px;
}

.currency-heading strong {
  color: #082b58;
  font-size: 16px;
}

.currency-heading p {
  color: #94a3b8;
  font-size: 11px;
  margin-top: 3px;
}

.helper-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.setting-row strong {
  color: #334155;
  font-size: 13px;
}

.publication-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f0f7ff;
  border-radius: 12px;
  padding: 14px;
  color: #475569;
  font-size: 12px;
}

.editor-footer {
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 28px;
}

@media (max-width: 600px) {
  .editor-header {
    padding: 18px;
  }

  .editor-body {
    padding: 14px !important;
  }

  .editor-section {
    padding: 17px;
  }

  .editor-footer {
    padding: 14px;
  }
}
</style>
