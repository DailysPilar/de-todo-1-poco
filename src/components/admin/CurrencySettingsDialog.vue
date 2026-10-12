
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  getCurrencySettings,
  saveCurrencySettings,
  saveStoreWhatsAppNumber,
} from '@/api/settings'
import { useAuthStore } from '@/stores/auth'

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
  set: (value) => emit('update:modelValue', value),
})

const usdRate = ref<number | null>(null)
const eurRate = ref<number | null>(null)
const whatsappNumber = ref('')

const loading = ref(false)
const savingRates = ref(false)
const savingWhatsApp = ref(false)

const ratesError = ref('')
const ratesSuccess = ref('')
const whatsappError = ref('')
const whatsappSuccess = ref('')
const loadError = ref('')

const whatsappValid = computed(() => {
  const normalized = whatsappNumber.value.replace(/[\s()+-]/g, '')

  return (
    normalized === '' ||
    /^[1-9][0-9]{7,14}$/.test(normalized)
  )
})

const busy = computed(
  () =>
    loading.value ||
    savingRates.value ||
    savingWhatsApp.value,
)

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !authStore.isAdmin) return

    loading.value = true
    loadError.value = ''
    ratesError.value = ''
    ratesSuccess.value = ''
    whatsappError.value = ''
    whatsappSuccess.value = ''

    try {
      const settings = await getCurrencySettings()

      usdRate.value = settings.usd_to_cup
      eurRate.value = settings.eur_to_cup
      whatsappNumber.value = settings.whatsapp_number || ''
    } catch (error) {
      loadError.value =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la configuración.'
    } finally {
      loading.value = false
    }
  },
)

async function saveRates() {
  if (!authStore.isAdmin || busy.value) return

  ratesError.value = ''
  ratesSuccess.value = ''

  if (
    usdRate.value == null ||
    eurRate.value == null ||
    !Number.isFinite(usdRate.value) ||
    !Number.isFinite(eurRate.value) ||
    usdRate.value <= 0 ||
    eurRate.value <= 0
  ) {
    ratesError.value = 'Introduce dos tasas válidas.'
    return
  }

  savingRates.value = true

  try {
    await saveCurrencySettings(
      usdRate.value,
      eurRate.value,
    )

    ratesSuccess.value = 'Tasas guardadas correctamente.'
    emit('saved')
  } catch (error) {
    ratesError.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron guardar las tasas.'
  } finally {
    savingRates.value = false
  }
}

async function saveWhatsApp() {
  if (!authStore.isAdmin || busy.value) return

  whatsappError.value = ''
  whatsappSuccess.value = ''

  if (!whatsappValid.value) {
    whatsappError.value =
      'Introduce un número internacional válido.'
    return
  }

  savingWhatsApp.value = true

  try {
    const savedNumber = await saveStoreWhatsAppNumber(
      whatsappNumber.value,
    )

    whatsappNumber.value = savedNumber || ''

    whatsappSuccess.value = savedNumber
      ? 'Número de WhatsApp guardado correctamente.'
      : 'WhatsApp desactivado correctamente.'

    emit('saved')
  } catch (error) {
    whatsappError.value =
      error instanceof Error
        ? error.message
        : 'No se pudo guardar el número de WhatsApp.'
  } finally {
    savingWhatsApp.value = false
  }
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    max-width="560"
    scrollable
  >
    <v-card
      class="settings-dialog"
      rounded="xl"
      elevation="8"
    >
      <!-- Encabezado -->
      <div class="settings-header">
        <div class="settings-icon">
          <v-icon
            icon="mdi-cog-outline"
            size="23"
          />
        </div>

        <div class="settings-header-text">
          <h2>Configuración de la tienda</h2>
          <p>Administra el contacto y las tasas de cambio.</p>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar configuración"
          :disabled="savingRates || savingWhatsApp"
          @click="dialog = false"
        />
      </div>

      <v-divider />

      <v-card-text class="settings-body">
        <v-alert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mb-4"
        >
          {{ loadError }}
        </v-alert>

        <!-- WhatsApp -->
        <section class="settings-section">
          <div class="section-heading">
            <div class="section-icon whatsapp-icon">
              <v-icon
                icon="mdi-whatsapp"
                size="20"
              />
            </div>

            <div>
              <h3>WhatsApp de la tienda</h3>
              <p>Recibe las consultas de tus clientes.</p>
            </div>
          </div>

          <v-alert
            v-if="whatsappError"
            type="error"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mb-3"
          >
            {{ whatsappError }}
          </v-alert>

          <v-alert
            v-if="whatsappSuccess"
            type="success"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mb-3"
          >
            {{ whatsappSuccess }}
          </v-alert>

          <v-form @submit.prevent="saveWhatsApp">
            <div class="field-label">
              Número de WhatsApp
            </div>

            <v-text-field
              v-model="whatsappNumber"
              variant="outlined"
              density="compact"
              rounded="lg"
              placeholder="Ej. 5351234567"
              prepend-inner-icon="mdi-phone-outline"
              inputmode="tel"
              autocomplete="tel"
              hide-details
              :error="!whatsappValid"
              :disabled="busy"
            />

            <p class="field-help">
              Introduce el código de país y el número,
              sin el signo +. Déjalo vacío para desactivar
              las consultas.
            </p>

            <v-btn
              type="submit"
              color="#19B56B"
              variant="flat"
              rounded="lg"
              size="small"
              class="save-button text-white"
              prepend-icon="mdi-content-save-outline"
              :loading="savingWhatsApp"
              :disabled="
                busy ||
                !whatsappValid ||
                !authStore.isAdmin ||
                !!loadError
              "
            >
              Guardar WhatsApp
            </v-btn>
          </v-form>
        </section>

        <v-divider class="section-divider" />

        <!-- Monedas -->
        <section class="settings-section">
          <div class="section-heading">
            <div class="section-icon currency-icon">
              <v-icon
                icon="mdi-currency-usd"
                size="20"
              />
            </div>

            <div>
              <h3>Tasas de cambio</h3>
              <p>Conversión de USD y EUR a pesos cubanos.</p>
            </div>
          </div>

          <v-alert
            v-if="ratesError"
            type="error"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mb-3"
          >
            {{ ratesError }}
          </v-alert>

          <v-alert
            v-if="ratesSuccess"
            type="success"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mb-3"
          >
            {{ ratesSuccess }}
          </v-alert>

          <v-form @submit.prevent="saveRates">
            <div class="rates-grid">
              <div class="rate-field">
                <div class="rate-label">
                  <span>Dólar estadounidense</span>

                  <v-chip
                    size="x-small"
                    variant="tonal"
                    color="primary"
                  >
                    USD
                  </v-chip>
                </div>

                <v-text-field
                  v-model.number="usdRate"
                  type="number"
                  min="0.0001"
                  step="any"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  suffix="CUP"
                  placeholder="Tasa USD"
                  hide-details
                  :disabled="busy"
                />
              </div>

              <div class="rate-field">
                <div class="rate-label">
                  <span>Euro</span>

                  <v-chip
                    size="x-small"
                    variant="tonal"
                    color="primary"
                  >
                    EUR
                  </v-chip>
                </div>

                <v-text-field
                  v-model.number="eurRate"
                  type="number"
                  min="0.0001"
                  step="any"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  suffix="CUP"
                  placeholder="Tasa EUR"
                  hide-details
                  :disabled="busy"
                />
              </div>
            </div>

            <div class="settings-note">
              <v-icon
                icon="mdi-information-outline"
                size="17"
                color="primary"
              />

              <span>
                Las nuevas tasas se aplicarán al crear o editar
                productos. Los precios publicados no cambian
                automáticamente.
              </span>
            </div>

            <v-btn
              type="submit"
              color="#087df1"
              variant="flat"
              rounded="lg"
              size="small"
              class="save-button"
              prepend-icon="mdi-content-save-outline"
              :loading="savingRates"
              :disabled="
                busy ||
                !authStore.isAdmin ||
                !!loadError
              "
            >
              Guardar tasas
            </v-btn>
          </v-form>
        </section>
      </v-card-text>

      <v-divider />

      <div class="settings-footer">
        <v-icon
          icon="mdi-shield-check-outline"
          size="15"
        />

        Configuración exclusiva de administradores
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.settings-dialog {
  background: #fff;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px 20px;
}

.settings-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eaf3ff;
  color: #087df1;
}

.settings-header-text {
  flex: 1;
  min-width: 0;
}

.settings-header h2 {
  margin: 0;
  color: #082b58;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.settings-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 11px;
}

.settings-body {
  padding: 20px !important;
}

.settings-section {
  width: 100%;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 17px;
}

.section-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 37px;
  height: 37px;
  border-radius: 10px;
}

.whatsapp-icon {
  color: #159b5b;
  background: #e8f9ef;
}

.currency-icon {
  color: #087df1;
  background: #eaf3ff;
}

.section-heading h3 {
  margin: 0;
  color: #082b58;
  font-size: 14px;
  font-weight: 800;
}

.section-heading p {
  margin: 3px 0 0;
  color: #94a3b8;
  font-size: 11px;
}

.field-label {
  margin-bottom: 7px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.field-help {
  margin: 7px 0 13px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.5;
}

.save-button {
  text-transform: none;
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0;
}

.section-divider {
  margin: 23px 0;
}

.rates-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.rate-field {
  min-width: 0;
  padding: 12px;
  border: 1px solid #e5ecf5;
  border-radius: 12px;
  background: #fafcff;
}

.rate-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  color: #334155;
  font-size: 11px;
  font-weight: 700;
}

.settings-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 14px 0;
  padding: 11px 12px;
  border-radius: 10px;
  background: #f0f7ff;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.settings-note .v-icon {
  flex-shrink: 0;
}

.settings-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 600;
  background: #fafcff;
}

@media (max-width: 600px) {
  .settings-header {
    padding: 14px;
    gap: 9px;
  }

  .settings-header h2 {
    font-size: 15px;
  }

  .settings-body {
    padding: 15px !important;
  }

  .rates-grid {
    grid-template-columns: 1fr;
  }

  .section-divider {
    margin: 19px 0;
  }
}
</style>
