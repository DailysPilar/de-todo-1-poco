
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
import { useNotificationsStore } from '@/stores/notifications'
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
const notifications = useNotificationsStore()
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
  () =>
    categories.value.find(
      category => category.id === categoryId.value,
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
  async (open, _oldValue, onCleanup) => {
    if (!open) return

    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })

    resetForm()
    loading.value = true
    ratesReady.value = false

    try {
      const [categoryData, settings] = await Promise.all([
        getCategories(),
        getCurrencySettings(),
      ])

      if (cancelled) return

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
      if (cancelled) return

      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los datos del formulario.'
    } finally {
      if (!cancelled) loading.value = false
    }
  },
  { immediate: true },
)

function updatePrice(currency: Currency, value: string) {
  prices.value[currency] = value

  if (!ratesReady.value || !accepted.value[currency]) return
  if (value.trim() === '') return

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
function generateSlugSuffix(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8)
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
async function saveProduct() {
  if (!authStore.isAdmin || saving.value) return

  errorMessage.value = ''

  if (!ratesReady.value || loading.value) {
    errorMessage.value =
      'No se ha cargado la configuración de monedas.'
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

  if (Object.values(parsed).every(price => price === null)) {
    errorMessage.value = 'Indica al menos un precio aceptado.'
    return
  }

  const payload: ProductInput = {
    name: name.value.trim(),
    category_id: categoryId.value,
    slug:
      props.product?.slug ??
      `${slug}-${generateSlugSuffix()}`,
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
    const wasEditing = editing.value

    if (wasEditing && props.product) {
      await updateProduct(props.product.id, payload)
    } else {
      await createProduct(payload)
    }

    emit('saved')
    dialog.value = false

    notifications.notify(
      wasEditing ? 'Producto actualizado' : 'Producto creado',
      wasEditing
        ? 'Los cambios del producto se guardaron correctamente.'
        : 'El producto se creó correctamente en la tienda.',
      'success',
    )
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
  <v-dialog
    v-model="dialog"
    max-width="780"
    max-height="92vh"
    scrollable
    :persistent="saving"
  >
    <v-card class="editor-card" rounded="xl">
      <!-- Encabezado -->
      <div class="editor-header">
        <div class="editor-heading">
          <div class="editor-icon">
            <v-icon
              :icon="
                editing
                  ? 'mdi-pencil-outline'
                  : 'mdi-package-variant-plus'
              "
              size="21"
            />
          </div>

          <div>
            <h2>
              {{ editing ? 'Editar producto' : 'Nuevo producto' }}
            </h2>
            <p>
              {{
                editing
                  ? 'Actualiza la información del producto.'
                  : 'Añade un producto a tu tienda.'
              }}
            </p>
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

      <!-- Contenido -->
      <v-card-text class="editor-body">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mb-3"
        >
          {{ errorMessage }}
        </v-alert>

        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-3"
        />

        <v-form
          id="product-editor-form"
          @submit.prevent="saveProduct"
        >
          <!-- Información principal -->
          <section class="editor-section">
            <div class="section-title">
              <div class="section-icon">
                <v-icon icon="mdi-text-box-outline" size="19" />
              </div>

              <div>
                <h3>Información principal</h3>
                <p>Datos básicos del producto.</p>
              </div>
            </div>

            <v-row dense>
              <v-col cols="12" sm="7">
                <label class="field-label">
                  Nombre del producto *
                </label>

                <v-text-field
                  v-model="name"
                  placeholder="Ej. Inversor solar de 5 kW"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  hide-details
                  :disabled="saving || loading"
                  class="editor-field"
                />
              </v-col>

              <v-col cols="12" sm="5">
                <label class="field-label">
                  Categoría *
                </label>

                <v-select
                  v-model="categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  placeholder="Seleccionar"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  hide-details
                  :disabled="saving || loading"
                  class="editor-field"
                />
              </v-col>

              <v-col cols="12">
                <label class="field-label">
                  Descripción
                </label>

                <v-textarea
                  v-model="description"
                  placeholder="Características, especificaciones y detalles del producto..."
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  rows="3"
                  auto-grow
                  hide-details
                  :disabled="saving || loading"
                  class="editor-field"
                />
              </v-col>
            </v-row>
          </section>

          <!-- Fotografías -->
          <ProductImagesManager
            v-if="editing && product"
            :key="product.id"
            :product-id="product.id"
            class="images-manager"
          />

          <v-alert
            v-else
            type="info"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="images-notice"
          >
            Guarda el producto para poder añadir sus fotografías.
          </v-alert>

          <!-- Precios -->
          <section class="editor-section">
            <div class="section-title">
              <div class="section-icon">
                <v-icon icon="mdi-cash-multiple" size="19" />
              </div>

              <div>
                <h3>Precios y monedas</h3>
                <p>Configura los precios de venta.</p>
              </div>
            </div>

            <div class="exchange-banner">
              <v-icon
                icon="mdi-swap-horizontal"
                size="19"
              />

              <div>
                <strong>Tasas configuradas</strong>

                <p>
                  1 USD = {{ formatRate(rates.USD) }} CUP
                  <span class="rate-separator">·</span>
                  1 EUR = {{ formatRate(rates.EUR) }} CUP
                </p>
              </div>
            </div>

            <v-row dense class="currency-grid">
              <v-col
                v-for="currency in currencies"
                :key="currency"
                cols="12"
                sm="4"
              >
                <div
                  class="currency-card"
                  :class="{
                    'currency-card--disabled': !accepted[currency],
                  }"
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
                        toggleCurrency(
                          currency,
                          Boolean($event),
                        )
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
                    density="compact"
                    rounded="lg"
                    hide-details
                    :suffix="currency"
                    :disabled="
                      !accepted[currency] ||
                      saving ||
                      loading
                    "
                    class="editor-field"
                    @update:model-value="
                      updatePrice(
                        currency,
                        String($event ?? ''),
                      )
                    "
                  />
                </div>
              </v-col>
            </v-row>

            <div class="helper-note">
              <v-icon
                icon="mdi-information-outline"
                size="17"
              />

              <span>
                Al modificar un precio se recalculan las demás
                monedas activas. Desactiva las que no aceptes.
              </span>
            </div>
          </section>

          <!-- Publicación -->
          <section class="editor-section publication-section">
            <div class="section-title">
              <div class="section-icon">
                <v-icon icon="mdi-storefront-outline" size="19" />
              </div>

              <div>
                <h3>Publicación y visibilidad</h3>
                <p>Controla cómo aparece en la tienda.</p>
              </div>
            </div>

            <label class="field-label">
              Estado del producto
            </label>

            <v-select
              v-model="status"
              :items="statusOptions"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              :disabled="saving || loading"
              class="editor-field status-field"
            />

            <div class="settings-container">
              <div class="setting-row">
                <div>
                  <strong>Disponible para la venta</strong>
                  <p>Indica si tienes existencias.</p>
                </div>

                <v-switch
                  v-model="available"
                  color="primary"
                  density="compact"
                  hide-details
                  :disabled="saving || loading"
                />
              </div>

              <v-divider />

              <div class="setting-row">
                <div>
                  <strong>Destacar en portada</strong>
                  <p>Mostrar entre los productos destacados.</p>
                </div>

                <v-switch
                  v-model="featured"
                  color="primary"
                  density="compact"
                  hide-details
                  :disabled="saving || loading"
                />
              </div>
            </div>

            <div class="publication-summary">
              <v-icon
                icon="mdi-check-decagram-outline"
                size="18"
                color="primary"
              />

              <span>
                {{ name.trim() || 'Nuevo producto' }}

                <template v-if="selectedCategoryName">
                  · {{ selectedCategoryName }}
                </template>

                ·
                {{
                  status === 'published'
                    ? 'Visible públicamente'
                    : 'No visible públicamente'
                }}
              </span>
            </div>
          </section>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- Footer compacto -->
      <div class="editor-footer">
        <span class="footer-hint">
          <v-icon
            icon="mdi-shield-check-outline"
            size="15"
          />
          Gestión de productos
        </span>

        <div class="footer-actions">
          <v-btn
            variant="text"
            rounded="lg"
            size="small"
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
            size="small"
            prepend-icon="mdi-content-save-outline"
            :loading="saving"
            :disabled="loading || !authStore.isAdmin"
          >
            {{
              editing
                ? 'Guardar cambios'
                : 'Crear producto'
            }}
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Estructura general */

.editor-card {
  background: #fff;
  overflow: hidden;
}

/* Encabezado */

.editor-header,
.editor-heading {
  display: flex;
  align-items: center;
}

.editor-header {
  justify-content: space-between;
  gap: 12px;
  padding: 13px 20px;
  background: #fff;
}

.editor-heading {
  gap: 11px;
  min-width: 0;
}

.editor-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: #eaf3ff;
  color: #087df1;
  border-radius: 11px;
}

.editor-heading h2 {
  margin: 0;
  color: #082b58;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.4px;
  line-height: 1.3;
}

.editor-heading p {
  margin: 2px 0 0;
  color: #8492a6;
  font-size: 11px;
  line-height: 1.4;
}

/* Contenido */

.editor-body {
  padding: 14px 18px !important;
  background: #f7f9fc;
}

.editor-section {
  padding: 17px 18px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e6edf5;
  border-radius: 14px;
}

.editor-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.section-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #edf5ff;
  color: #087df1;
}

.section-title h3 {
  margin: 0;
  color: #082b58;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

.section-title p {
  margin: 2px 0 0;
  color: #8a98ab;
  font-size: 11px;
  line-height: 1.4;
}

/* Campos */

.field-label {
  display: block;
  margin-bottom: 5px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.editor-field :deep(.v-field) {
  border-radius: 9px;
  background: #fbfcff;
}

.editor-field :deep(.v-field:hover) {
  background: #f6faff;
}

.editor-field :deep(.v-field--focused) {
  background: #fff;
}

.editor-field :deep(.v-field__input) {
  font-size: 13px;
}

/* Fotografías */

.images-manager {
  margin-bottom: 12px;
}

.images-notice {
  margin-bottom: 12px;
  font-size: 12px;
}

/* Monedas */

.exchange-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid #dcecff;
  border-radius: 10px;
  background: #f0f7ff;
  color: #087df1;
}

.exchange-banner strong {
  font-size: 12px;
  font-weight: 750;
}

.exchange-banner p {
  margin: 2px 0 0;
  color: #52657e;
  font-size: 11px;
  line-height: 1.4;
}

.rate-separator {
  padding: 0 6px;
  color: #94a3b8;
}

.currency-grid {
  margin-top: 0;
}

.currency-card {
  height: 100%;
  padding: 11px;
  border: 1px solid #dce7f4;
  border-radius: 11px;
  background: #fbfdff;
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}

.currency-card--disabled {
  opacity: 0.55;
  background: #f5f6f8;
}

.currency-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 7px;
}

.currency-heading strong {
  color: #082b58;
  font-size: 14px;
  font-weight: 800;
}

.currency-heading p {
  margin: 1px 0 0;
  color: #94a3b8;
  font-size: 10px;
  line-height: 1.3;
}

.currency-heading :deep(.v-switch) {
  flex: 0 0 auto;
}

.helper-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 11px;
  color: #718096;
  font-size: 11px;
  line-height: 1.5;
}

.helper-note .v-icon {
  flex-shrink: 0;
  color: #087df1;
}

/* Publicación */

.status-field {
  margin-bottom: 12px;
}

.settings-container {
  padding: 0 12px;
  border: 1px solid #e7edf5;
  border-radius: 11px;
  background: #fbfcff;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 57px;
  padding: 8px 0;
}

.setting-row strong {
  color: #334155;
  font-size: 12px;
  font-weight: 750;
}

.setting-row p {
  margin: 2px 0 0;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.4;
}

.setting-row :deep(.v-switch) {
  flex: 0 0 auto;
}

.publication-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-top: 12px;
  border-radius: 10px;
  background: #f0f7ff;
  color: #52657e;
  font-size: 11px;
  line-height: 1.5;
}

.publication-summary .v-icon {
  flex-shrink: 0;
}

/* Footer */

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 54px;
  padding: 8px 18px;
  background: #fafcff;
}

.footer-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 11px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.footer-actions :deep(.v-btn) {
  min-height: 38px;
  padding-inline: 15px;
  text-transform: none;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

/* Responsive */

@media (max-width: 600px) {
  .editor-header {
    padding: 11px 14px;
  }

  .editor-heading {
    gap: 9px;
  }

  .editor-icon {
    width: 36px;
    height: 36px;
  }

  .editor-heading h2 {
    font-size: 17px;
  }

  .editor-heading p {
    font-size: 10px;
  }

  .editor-body {
    padding: 10px !important;
  }

  .editor-section {
    padding: 13px;
    margin-bottom: 10px;
    border-radius: 12px;
  }

  .section-title {
    margin-bottom: 12px;
  }

  .section-title h3 {
    font-size: 13px;
  }

  .section-title p {
    font-size: 10px;
  }

  .exchange-banner {
    padding: 9px 10px;
  }

  .currency-card {
    padding: 10px;
  }

  .images-manager,
  .images-notice {
    margin-bottom: 10px;
  }

  .editor-footer {
    min-height: 56px;
    padding: 9px 14px;
  }

  .footer-hint {
    display: none;
  }

  .footer-actions {
    width: 100%;
    justify-content: stretch;
    gap: 8px;
  }

  .footer-actions :deep(.v-btn) {
    flex: 1;
    min-height: 38px;
    padding-inline: 10px;
    font-size: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .currency-card {
    transition: none;
  }
}
</style>
