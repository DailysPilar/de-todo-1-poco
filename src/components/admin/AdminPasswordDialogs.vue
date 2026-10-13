
<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  changePassword,
  requestPasswordReset,
} from '@/api/auth'

const props = defineProps<{
  modelValue: boolean
  mode: 'change' | 'reset'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

function closeDialog() {
  emit('update:modelValue', false)
}

watch(
  () => [props.modelValue, props.mode],
  () => {
    email.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showPassword.value = false
    errorMessage.value = ''
    successMessage.value = ''
  },
)

async function submit() {
  if (loading.value) return

  errorMessage.value = ''
  successMessage.value = ''

  if (props.mode === 'reset') {
    if (!email.value.trim()) {
      errorMessage.value = 'Introduce tu correo electrónico.'
      return
    }
  } else {
    if (newPassword.value.length < 8) {
      errorMessage.value =
        'La contraseña debe tener al menos 8 caracteres.'
      return
    }

    if (newPassword.value !== confirmPassword.value) {
      errorMessage.value = 'Las contraseñas no coinciden.'
      return
    }
  }

  loading.value = true

  try {
    if (props.mode === 'reset') {
      await requestPasswordReset(email.value.trim())

      successMessage.value =
        'Si existe una cuenta asociada a ese correo, recibirás instrucciones para recuperar tu contraseña.'
    } else {
      await changePassword(newPassword.value)

      successMessage.value =
        'Contraseña actualizada correctamente.'

      newPassword.value = ''
      confirmPassword.value = ''
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No se pudo completar la operación.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    scrollable
    @update:model-value="
      emit('update:modelValue', $event)
    "
  >
    <v-card rounded="xl">
      <v-card-title class="dialog-title">
        <div class="title-icon">
          <v-icon
            :icon="
              mode === 'change'
                ? 'mdi-lock-reset'
                : 'mdi-email-lock-outline'
            "
            size="24"
          />
        </div>

        <div class="title-text">
          <div>
            {{
              mode === 'change'
                ? 'Cambiar contraseña'
                : 'Recuperar contraseña'
            }}
          </div>

          <span>
            {{
              mode === 'change'
                ? 'Seguridad de tu cuenta'
                : 'Acceso administrativo'
            }}
          </span>
        </div>

        <v-spacer />

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text class="pt-4">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="comfortable"
          rounded="lg"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          variant="tonal"
          density="comfortable"
          rounded="lg"
          class="mb-4"
        >
          {{ successMessage }}
        </v-alert>

        <v-form
          v-if="!successMessage"
          @submit.prevent="submit"
        >
          <template v-if="mode === 'reset'">
            <p class="helper-text">
              Introduce el correo asociado a tu cuenta.
              Te enviaremos un enlace para restablecer
              la contraseña.
            </p>

            <v-text-field
              v-model="email"
              label="Correo electrónico"
              type="email"
              autocomplete="email"
              prepend-inner-icon="mdi-email-outline"
              variant="outlined"
              rounded="lg"
              :disabled="loading"
              required
            />
          </template>

          <template v-else>
            <v-text-field
              v-model="newPassword"
              label="Nueva contraseña"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="
                showPassword
                  ? 'mdi-eye-off-outline'
                  : 'mdi-eye-outline'
              "
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              variant="outlined"
              rounded="lg"
              :disabled="loading"
              @click:append-inner="
                showPassword = !showPassword
              "
            />

            <v-text-field
              v-model="confirmPassword"
              label="Confirmar contraseña"
              prepend-inner-icon="mdi-lock-check-outline"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              variant="outlined"
              rounded="lg"
              :disabled="loading"
            />
          </template>

          <v-btn
            type="submit"
            color="#087df1"
            size="large"
            rounded="lg"
            block
            :loading="loading"
          >
            {{
              mode === 'change'
                ? 'Guardar contraseña'
                : 'Enviar correo de recuperación'
            }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: #082b58;
  font-size: 16px;
  font-weight: 750;
  white-space: normal;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #eaf3ff;
  color: #087df1;
}

.title-text {
  min-width: 0;
}

.title-text span {
  display: block;
  margin-top: 3px;
  color: #7b8ba3;
  font-size: 12px;
  font-weight: 400;
}

.helper-text {
  margin-bottom: 18px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
</style>
