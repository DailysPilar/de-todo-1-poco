
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CurrencySettingsDialog from '@/components/admin/CurrencySettingsDialog.vue'

const router = useRouter()
const search = ref('')
const mobileMenuOpen = ref(false)
const currencySettingsDialog = ref(false)

const authStore = useAuthStore()

const loginDialog = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const showPassword = ref(false)
const loginError = ref('')
const loginLoading = ref(false)

function openLoginDialog() {
  loginEmail.value = ''
  loginPassword.value = ''
  loginError.value = ''
  showPassword.value = false
  loginDialog.value = true
}

async function submitAdminLogin() {
  loginError.value = ''

  if (!loginEmail.value.trim() || !loginPassword.value) {
    loginError.value = 'Introduce tu correo y contraseña.'
    return
  }

  loginLoading.value = true

  try {
    await authStore.login(
      loginEmail.value.trim(),
      loginPassword.value,
    )

    loginDialog.value = false
    loginPassword.value = ''
  } catch (error) {
    loginError.value =
      error instanceof Error
        ? error.message
        : 'No se pudo iniciar sesión.'
  } finally {
    loginLoading.value = false
  }
}

async function signOutAdmin() {
  try {
    await authStore.logout()
    loginDialog.value = false
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
// Más adelante pondremos el número real de WhatsApp.
const whatsappNumber = ''

function submitSearch() {
  const term = search.value.trim()

  router.push({
    path: '/catalogo',
    query: term ? { q: term } : {},
  })

  mobileMenuOpen.value = false
}

function goToCategories() {
  mobileMenuOpen.value = false

  router.push({
    path: '/',
    hash: '#categorias',
  })
}

function openWhatsApp() {
  if (!whatsappNumber) return

  const message = encodeURIComponent(
    "¡Hola! Estoy visitando D'todo 1 poco y quisiera hacer una consulta.",
  )

  window.open(
    `https://wa.me/${whatsappNumber}?text=${message}`,
    '_blank',
    'noopener,noreferrer',
  )
}
</script>

<template>
  <v-app-bar
    color="white"
    elevation="0"
    height="76"
    class="store-header"
  >
    <v-container class="header-container">
      <router-link to="/" class="store-logo">
        <span class="store-logo-name">
          D'todo <strong>1 poco</strong>
        </span>
        <span class="store-logo-tagline">
          De todo para ti.
        </span>
      </router-link>

     <form
        class="header-search d-none d-md-flex"
        role="search"
        @submit.prevent="submitSearch"
      >
        <input
          v-model="search"
          type="search"
          placeholder="Buscar paneles, baterías, motores..."
          aria-label="Buscar productos"
        />

        <button
          type="submit"
          class="search-submit"
          aria-label="Buscar productos"
        >
          <v-icon icon="mdi-magnify" size="22" />
        </button>
      </form>

      <nav class="desktop-navigation d-none d-md-flex">
        <v-btn
          to="/"
          variant="text"
          rounded="lg"
          class="nav-button"
          exact
        >
          Inicio
        </v-btn>

        <v-btn
          to="/catalogo"
          variant="text"
          rounded="lg"
          class="nav-button"
        >
          Catálogo
        </v-btn>
      </nav>

      <v-btn
        icon="mdi-whatsapp"
        variant="tonal"
        color="success"
        rounded="lg"
        class="whatsapp-button"
        :disabled="!whatsappNumber"
        aria-label="Contactar por WhatsApp"
        @click="openWhatsApp"
      />
      <!-- Opciones de administración -->
      <v-menu location="bottom end" offset="8">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-dots-vertical"
            variant="text"
            rounded="lg"
            aria-label="Opciones"
            class="admin-menu-button"
          />
        </template>

        <v-list
          elevation="4"
          rounded="lg"
          min-width="220"
          density="comfortable"
        >
          <template v-if="authStore.isAdmin">
            <v-list-item
              prepend-icon="mdi-shield-account-outline"
              :title="authStore.profile?.display_name || 'Administrador'"
              subtitle="Sesión administrativa"
              disabled
            />

            <v-divider class="my-1" />
            
            <v-list-item
              prepend-icon="mdi-currency-usd"
              title="Configuración de monedas"
              subtitle="Tasas USD y EUR"
              @click="currencySettingsDialog = true"
            />

            <v-divider class="my-1" />

            <v-list-item
              prepend-icon="mdi-logout"
              title="Cerrar sesión"
              @click="signOutAdmin"
            />
          </template>

          <v-list-item
            v-else
            prepend-icon="mdi-lock-outline"
            title="Acceso administrador"
            @click="openLoginDialog"
          />
        </v-list>
      </v-menu>

      <v-btn
        icon="mdi-menu"
        variant="text"
        class="d-md-none ml-2"
        aria-label="Abrir menú"
        @click="mobileMenuOpen = !mobileMenuOpen"
      />
    </v-container>
  </v-app-bar>

  <!-- Buscador y menú para móviles -->
  <div class="mobile-header-extras d-md-none">
    <form
      class="mobile-search"
      role="search"
      @submit.prevent="submitSearch"
    >
      <input
        v-model="search"
        type="search"
        placeholder="¿Qué estás buscando?"
        aria-label="Buscar productos"
      />

      <button
        type="submit"
        class="search-submit"
        aria-label="Buscar productos"
      >
        <v-icon icon="mdi-magnify" size="22" />
      </button>
    </form>

    <nav v-if="mobileMenuOpen" class="mobile-navigation">
      <v-btn
        to="/"
        variant="text"
        block
        @click="mobileMenuOpen = false"
      >
        Inicio
      </v-btn>

      <v-btn
        to="/catalogo"
        variant="text"
        block
        @click="mobileMenuOpen = false"
      >
        Catálogo
      </v-btn>

      <v-btn
        variant="text"
        block
        @click="goToCategories"
      >
        Categorías
      </v-btn>
    </nav>
  </div>
  <!-- Diálogo de acceso administrativo -->
<v-dialog
  v-model="loginDialog"
  max-width="420"
>
  <v-card class="admin-login-card" rounded="xl">
    <v-card-title class="admin-login-title">
      <div class="admin-login-icon">
        <v-icon
          icon="mdi-shield-lock-outline"
          size="26"
        />
      </div>

      <div>
        <div>Acceso administrativo</div>
        <div class="admin-login-subtitle">
          D'todo 1 poco
        </div>
      </div>

      <v-spacer />

      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        aria-label="Cerrar"
        @click="loginDialog = false"
      />
    </v-card-title>

    <v-card-text class="pt-4">
      <v-alert
        v-if="loginError"
        type="error"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-4"
      >
        {{ loginError }}
      </v-alert>

      <v-form @submit.prevent="submitAdminLogin">
        <v-text-field
          v-model="loginEmail"
          label="Correo electrónico"
          placeholder="admin@ejemplo.com"
          prepend-inner-icon="mdi-email-outline"
          type="email"
          variant="outlined"
          rounded="lg"
          autocomplete="username"
          class="mb-2"
          :disabled="loginLoading"
        />

        <v-text-field
          v-model="loginPassword"
          label="Contraseña"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="
            showPassword
              ? 'mdi-eye-off-outline'
              : 'mdi-eye-outline'
          "
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          rounded="lg"
          autocomplete="current-password"
          :disabled="loginLoading"
          @click:append-inner="
            showPassword = !showPassword
          "
        />

        <v-btn
          type="submit"
          color="#087df1"
          size="large"
          rounded="lg"
          block
          class="mt-3"
          :loading="loginLoading"
        >
          Iniciar sesión
        </v-btn>
      </v-form>
    </v-card-text>

    <v-card-text class="admin-login-footer">
      Acceso exclusivo para administradores de la tienda.
    </v-card-text>
  </v-card>
</v-dialog>
<CurrencySettingsDialog
  v-if="authStore.isAdmin"
  v-model="currencySettingsDialog"
/>
</template>

<style scoped>
.store-header {
  border-bottom: 1px solid #e8edf5;
}
.header-search,
.mobile-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 4px 5px 4px 15px;
  background: #f5f8fc;
  border: 1px solid #e5ecf5;
  border-radius: 12px;
  transition: border-color 0.2s ease;
}

.header-search {
  flex: 1;
  max-width: 480px;
  min-width: 0;
}

.mobile-search {
  width: 100%;
}

.header-search:focus-within,
.mobile-search:focus-within {
  border-color: #087df1;
}

.header-search input,
.mobile-search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #082b58;
  font-size: 13px;
}

.header-search input::placeholder,
.mobile-search input::placeholder {
  color: #94a3b8;
}

.search-submit {
  width: 36px;
  height: 36px;
  min-width: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 9px;
  background: #087df1;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-submit:hover {
  background: #0669cc;
}

.search-submit:focus-visible {
  outline: 2px solid #082b58;
  outline-offset: 2px;
}
.header-container {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 100%;
}

.store-logo {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  text-decoration: none;
  line-height: 1.2;
}

.store-logo-name {
  color: #082b58;
  font-size: 22px;
  font-weight: 850;
  letter-spacing: -0.8px;
  white-space: nowrap;
}

.store-logo-name strong {
  color: #087df1;
}

.store-logo-tagline {
  color: #7b8ba3;
  font-size: 11px;
  margin-top: 3px;
}

.header-search {
  flex: 1;
  max-width: 480px;
  min-width: 0;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 5px 4px 14px;
  background: #f5f8fc;
  border: 1px solid #e5ecf5;
  border-radius: 12px;
  transition: border-color 0.2s;
}

.header-search:focus-within,
.mobile-search:focus-within {
  border-color: #087df1;
}

.header-search input,
.mobile-search input {
  flex: 1;
  min-width: 0;
  outline: none;
  border: none;
  background: transparent;
  color: #082b58;
  font-size: 13px;
}

.header-search input::placeholder,
.mobile-search input::placeholder {
  color: #94a3b8;
}

.search-submit {
  background: #087df1;
  color: white;
  border-radius: 9px;
  padding: 9px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.desktop-navigation {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.nav-button {
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  color: #082b58;
}

.nav-button.router-link-active {
  color: #087df1;
  background: #eaf3ff;
}

.whatsapp-button {
  flex-shrink: 0;
}

.mobile-header-extras {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #e8edf5;
}

.mobile-search {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #e5ecf5;
  background: #f5f8fc;
}

.mobile-search button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-navigation {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
}

@media (max-width: 1100px) {
  .header-container {
    gap: 10px;
  }

  .store-logo-name {
    font-size: 19px;
  }
}

@media (max-width: 600px) {
  .header-container {
    padding-left: 16px;
    padding-right: 16px;
  }

  .store-logo-name {
    font-size: 20px;
  }

  .whatsapp-button {
    margin-left: auto;
  }
}
.admin-menu-button {
  flex-shrink: 0;
  color: #082b58;
}

.admin-login-card {
  overflow: hidden;
}

.admin-login-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 12px;
  color: #082b58;
  font-size: 17px;
  font-weight: 750;
  white-space: normal;
}

.admin-login-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 14px;
  background: #eaf3ff;
  color: #087df1;
}

.admin-login-subtitle {
  margin-top: 3px;
  color: #7b8ba3;
  font-size: 12px;
  font-weight: 400;
}

.admin-login-footer {
  padding-top: 0;
  padding-bottom: 22px;
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
}
</style>
