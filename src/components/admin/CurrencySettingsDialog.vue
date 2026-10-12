
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  getCurrencySettings,
  saveCurrencySettings,
} from '@/api/settings.ts'
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

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !authStore.isAdmin) return

    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const settings = await getCurrencySettings()

      usdRate.value = settings.usd_to_cup
      eurRate.value = settings.eur_to_cup
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la configuración.'
    } finally {
      loading.value = false
    }
  },
)

async function save() {
  if (!authStore.isAdmin) return

  if (
    usdRate.value == null ||
    eurRate.value == null ||
    !Number.isFinite(usdRate.value) ||
    !Number.isFinite(eurRate.value) ||
    usdRate.value <= 0 ||
    eurRate.value <= 0
  ) {
    errorMessage.value = 'Introduce dos tasas válidas.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await saveCurrencySettings(
      usdRate.value,
      eurRate.value,
    )

    successMessage.value = 'Tasas guardadas correctamente.'
    emit('saved')
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No se pudieron guardar las tasas.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="520" scrollable>
    <v-card class="settings-dialog" rounded="xl" elevation="8">
      <div class="settings-header">
        <div class="settings-icon">
          <v-icon icon="mdi-currency-usd" size="26" />
        </div>

        <div class="flex-grow-1">
          <h2>Configuración de monedas</h2>
          <p>Administra las tasas de conversión de la tienda.</p>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar configuración"
          @click="dialog = false"
        />
      </div>

      <v-divider />

      <v-card-text class="pa-6">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          rounded="lg"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          variant="tonal"
          rounded="lg"
          class="mb-4"
        >
          {{ successMessage }}
        </v-alert>

        <v-form @submit.prevent="save">
          <div class="section-heading mb-5">
            <v-icon icon="mdi-swap-horizontal" color="primary" />
            <span>Tasas de cambio</span>
          </div>

          <div class="rate-field mb-4">
            <div class="rate-label">
              <span>1 dólar estadounidense (USD)</span>
              <v-chip size="small" variant="tonal" color="primary">
                USD
              </v-chip>
            </div>

            <v-text-field
              v-model.number="usdRate"
              type="number"
              min="0.0001"
              step="any"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              suffix="CUP"
              placeholder="Introduce la tasa"
              hide-details
              :disabled="loading || saving"
            />
          </div>

          <div class="rate-field mb-4">
            <div class="rate-label">
              <span>1 euro (EUR)</span>
              <v-chip size="small" variant="tonal" color="primary">
                EUR
              </v-chip>
            </div>

            <v-text-field
              v-model.number="eurRate"
              type="number"
              min="0.0001"
              step="any"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              suffix="CUP"
              placeholder="Introduce la tasa"
              hide-details
              :disabled="loading || saving"
            />
          </div>

          <div class="settings-note">
            <v-icon
              icon="mdi-information-outline"
              color="primary"
              size="20"
            />
            <span>
              Estas tasas se utilizarán para calcular los precios
              al crear o editar productos. No modificarán
              automáticamente los precios ya publicados.
            </span>
          </div>

          <v-btn
            type="submit"
            color="#087df1"
            variant="flat"
            rounded="lg"
            size="large"
            block
            class="mt-6"
            :loading="saving"
            :disabled="loading || !authStore.isAdmin"
          >
            <v-icon start icon="mdi-content-save-outline" />
            Guardar configuración
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.settings-dialog {
  background: #ffffff;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px;
}

.settings-header h2 {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.4px;
  color: #082b58;
}

.settings-header p {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.settings-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #eaf3ff;
  color: #087df1;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 750;
  color: #082b58;
}

.rate-field {
  padding: 16px;
  border: 1px solid #e5ecf5;
  border-radius: 14px;
  background: #fafcff;
}

.rate-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 650;
  color: #334155;
}

.settings-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  background: #f0f7ff;
  color: #475569;
  font-size: 12px;
  line-height: 1.6;
}
</style>
