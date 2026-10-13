
<script setup lang="ts">
import { computed, onMounted, ref, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getStoreWhatsAppNumber } from '@/api/settings'
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp'
import CurrencySettingsDialog from '@/components/admin/CurrencySettingsDialog.vue'
import logo from '@/assets/branding/logo.png'

const router = useRouter()

const route = useRoute()
const heroLogoVisible = ref(true)

let logoObserver: IntersectionObserver | null = null

const showHeaderLogo = computed(() => {
  if (route.path !== '/') return true

  return !heroLogoVisible.value
})

function observeHeroLogo() {
  logoObserver?.disconnect()
  logoObserver = null

  if (route.path !== '/') {
    heroLogoVisible.value = false
    return
  }

  heroLogoVisible.value = true

  const heroLogo = document.getElementById('home-hero-logo')

  if (!heroLogo) return

  logoObserver = new IntersectionObserver(
    ([entry]) => {
      heroLogoVisible.value = entry?.isIntersecting ?? false
    },
    {
      threshold: 0,
    },
  )

  logoObserver.observe(heroLogo)
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    observeHeroLogo()
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => {
  logoObserver?.disconnect()
})

const authStore = useAuthStore()

// Navegación y búsqueda
const search = ref('')
const mobileMenuOpen = ref(false)
const activeMobileNavigation = computed(() => {
  if (route.path === '/catalogo') return 'catalog'
  if (route.path === '/' && route.hash === '#categorias') {
    return 'categories'
  }
  if (route.path === '/' && route.hash === '#destacados') {
    return 'featured'
  }
  if (route.path === '/') return 'home'

  return null
})

// Administración
const currencySettingsDialog = ref(false)
const loginDialog = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const showPassword = ref(false)
const loginError = ref('')
const loginLoading = ref(false)

// WhatsApp
const whatsappNumber = ref<string | null>(null)

const whatsappUrl = computed(() => {
  if (!whatsappNumber.value) return undefined

  return buildGeneralWhatsAppUrl(whatsappNumber.value)
})

async function loadWhatsAppNumber() {
  try {
    whatsappNumber.value = await getStoreWhatsAppNumber()
  } catch (error) {
    console.error('Error cargando WhatsApp:', error)
    whatsappNumber.value = null
  }
}

onMounted(loadWhatsAppNumber)

// Búsqueda
function submitSearch() {
  const term = search.value.trim()

  mobileMenuOpen.value = false

  router.push({
    path: '/catalogo',
    query: term ? { q: term } : {},
  })
}

// Navegación
function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function goToHome() {
  closeMobileMenu()
  router.push('/')
}

function goToCatalog() {
  closeMobileMenu()
  router.push('/catalogo')
}

function goToCategories() {
  closeMobileMenu()

  router.push({
    path: '/',
    hash: '#categorias',
  })
}

function goToFeaturedProducts() {
  closeMobileMenu()

  router.push({
    path: '/',
    hash: '#destacados',
  })
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  router.push('/')
}

// Administración
function openLoginDialog() {
  closeMobileMenu()

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
    currencySettingsDialog.value = false
    closeMobileMenu()
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
</script>

<template>
  <div class="header-wrapper">
    <!-- Barra principal -->
    <v-app-bar
      color="white"
      elevation="0"
      height="72"
      class="store-header"
    >
      <v-container class="header-container">
        <!-- Logo -->
        <router-link
          to="/"
          class="store-logo"
          aria-label="Ir al inicio"
          @click="closeMobileMenu"
        >
          <img
            v-if="showHeaderLogo"
            :src="logo"
            alt=""
            class="header-brand-image"
          />

          <div class="store-logo-text">
            <span class="store-logo-name">
              D'todo <strong>1 poco</strong>
            </span>

            <span class="store-logo-tagline">
              De todo para ti.
            </span>
          </div>
        </router-link>

        <!-- Buscador de escritorio -->
        <form
          class="header-search desktop-search"
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
            aria-label="Buscar"
          >
            <v-icon
              icon="mdi-magnify"
              size="21"
            />
          </button>
        </form>

        <!-- Navegación de escritorio -->
        <nav class="desktop-navigation">
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

        <!-- Acciones del header -->
        <div class="header-actions">
          <!-- WhatsApp -->
          <v-btn
            icon="mdi-whatsapp"
            rounded="lg"
            class="header-action-button whatsapp-button"
            :href="whatsappUrl"
            :disabled="!whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
          />

          <!-- Menú administrativo -->
          <v-menu
            location="bottom end"
            offset="8"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-dots-vertical"
                variant="text"
                rounded="lg"
                class="header-action-button admin-menu-button"
                aria-label="Opciones de administración"
                @click="goToHome"
              />
            </template>

            <v-list
              elevation="0"
              rounded="xl"
              min-width="260"
              density="comfortable"
              class="admin-options-menu"
            >
              <template v-if="authStore.isAdmin">
                <v-list-item
                  prepend-icon="mdi-shield-account-outline"
                  :title="
                    authStore.profile?.display_name ||
                    'Administrador'
                  "
                  subtitle="Sesión administrativa"
                  disabled
                  class="admin-menu-profile"
                />

                <v-list-item
                  title="Configuración de la tienda"
                  prepend-icon="mdi-cog-outline"
                  class="admin-menu-item"
                  @click="currencySettingsDialog = true"
                />

                <v-list-item
                  prepend-icon="mdi-logout"
                  title="Cerrar sesión"
                  class="admin-menu-item admin-menu-item--danger"
                  @click="signOutAdmin"
                />
              </template>

              <v-list-item
                v-else
                prepend-icon="mdi-lock-outline"
                title="Acceso administrador"
                class="admin-menu-item"
                @click="openLoginDialog"
              />
            </v-list>
          </v-menu>

          <!-- Menú móvil -->
          <v-btn
            :icon="
              mobileMenuOpen
                ? 'mdi-close'
                : 'mdi-menu'
            "
            variant="text"
            rounded="lg"
            class="header-action-button mobile-menu-button"
            :aria-label="
              mobileMenuOpen
                ? 'Cerrar menú'
                : 'Abrir menú'
            "
            :aria-expanded="mobileMenuOpen"
            aria-controls="mobile-store-navigation"
            @click="toggleMobileMenu"
          />
        </div>
      </v-container>
    </v-app-bar>

    <!-- Zona móvil debajo de la barra -->
    <div class="mobile-header-extras">
      <v-container class="mobile-extras-container">
        <!-- Buscador móvil -->
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
            class="mobile-search-submit"
            aria-label="Buscar"
          >
            
          <v-icon
            icon="mdi-magnify"
            size="20"
            class="mobile-search-icon"
          />
          </button>
        </form>

        <!-- Navegación desplegable -->
        <nav
          v-if="mobileMenuOpen"
          id="mobile-store-navigation"
          class="mobile-navigation"
          aria-label="Navegación principal"
        >
          <v-btn
            variant="text"
            prepend-icon="mdi-home-outline"
            :class="[
              'mobile-nav-button',
              {
                'mobile-nav-button--active':
                  activeMobileNavigation === 'home',
              },
            ]"
            :aria-current="
              activeMobileNavigation === 'home'
                ? 'page'
                : undefined
            "
            block
            @click="goToHome"
          >
            Inicio
          </v-btn>

          <v-btn
            variant="text"
            prepend-icon="mdi-view-grid-outline"
            :class="[
              'mobile-nav-button',
              {
                'mobile-nav-button--active':
                  activeMobileNavigation === 'catalog',
              },
            ]"
            :aria-current="
              activeMobileNavigation === 'catalog'
                ? 'page'
                : undefined
            "
            block
            @click="goToCatalog"
          >
            Catálogo
          </v-btn>

          <v-btn
            variant="text"
            prepend-icon="mdi-shape-outline"
            :class="[
              'mobile-nav-button',
              {
                'mobile-nav-button--active':
                  activeMobileNavigation === 'categories',
              },
            ]"
            :aria-current="
              activeMobileNavigation === 'categories'
                ? 'page'
                : undefined
            "
            block
            @click="goToCategories"
          >
            Categorías
          </v-btn>

          <v-btn
            variant="text"
            prepend-icon="mdi-star-outline"
            :class="[
              'mobile-nav-button',
              {
                'mobile-nav-button--active':
                  activeMobileNavigation === 'featured',
              },
            ]"
            :aria-current="
              activeMobileNavigation === 'featured'
                ? 'page'
                : undefined
            "
            block
            @click="goToFeaturedProducts"
          >
            Productos destacados
          </v-btn>
        </nav>
      </v-container>
    </div>
  </div>

  <!-- Diálogo de acceso administrativo -->
  <v-dialog
    v-model="loginDialog"
    max-width="420"
    scrollable
  >
    <v-card
      class="admin-login-card"
      rounded="xl"
    >
      <v-card-title class="admin-login-title">
        <div class="admin-login-icon">
          <v-icon
            icon="mdi-shield-lock-outline"
            size="24"
          />
        </div>

        <div class="login-heading">
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
            :type="
              showPassword
                ? 'text'
                : 'password'
            "
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

  <!-- Configuración de la tienda -->
  <CurrencySettingsDialog
    v-if="authStore.isAdmin"
    v-model="currencySettingsDialog"
    @saved="loadWhatsAppNumber"
  />
</template>

<style scoped>
/* Estructura general */
.header-wrapper {
  width: 100%;
}

.store-header {
  border-bottom: 1px solid #e8edf5;
}

.header-container {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 100%;
  min-width: 0;
}

/* Logo */
.store-logo {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  min-width: 0;
  text-decoration: none;
}

.store-logo-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.header-brand-image {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .header-brand-image {
    width: 38px;
    height: 38px;
  }

  .store-logo {
    gap: 4px;
  }
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
  margin-top: 3px;
  color: #7b8ba3;
  font-size: 11px;
}

/* Buscador de escritorio */
.header-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  max-width: 480px;
  height: 44px;
  padding: 4px 5px 4px 14px;
  border: 1px solid #e5ecf5;
  border-radius: 12px;
  background: #f5f8fc;
  transition: border-color 0.2s ease;
}

.header-search:focus-within,
.mobile-search:focus-within {
  border-color: #087df1;
}

.header-search input,
.mobile-search input {
  flex: 1;
  width: 100%;
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 9px;
  background: #087df1;
  color: white;
  cursor: pointer;
}

.search-submit:hover {
  background: #0669cc;
}

/* Navegación de escritorio */
.desktop-navigation {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.nav-button {
  color: #082b58;
  font-size: 13px;
  font-weight: 650;
  text-transform: none;
  letter-spacing: 0;
}

.nav-button.router-link-active {
  color: #087df1;
  background: #eaf3ff;
}

/* Acciones */
.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 6px;
}

.header-action-button {
  flex-shrink: 0;
}

.whatsapp-button {
  color: #19b56b;
}

.admin-menu-button {
  color: #082b58;
}

.admin-options-menu {
  padding: 8px;
  border: 1px solid #e5ecf5;
  box-shadow: 0 12px 32px rgba(8, 43, 88, 0.14);
}

:deep(.admin-menu-profile) {
  margin-bottom: 6px;
  border-radius: 12px;
  background: #f0f6ff;
  opacity: 1 !important;
}

:deep(.admin-menu-profile .v-list-item-title) {
  color: #082b58;
  font-size: 13px;
  font-weight: 800;
}

:deep(.admin-menu-profile .v-list-item-subtitle) {
  color: #718096;
  font-size: 11px;
  opacity: 1;
}

:deep(.admin-menu-profile .v-icon) {
  color: #087df1;
  opacity: 1;
}

:deep(.admin-menu-item) {
  min-height: 42px;
  margin-top: 3px;
  border-radius: 10px;
  color: #082b58;
  font-size: 13px;
  font-weight: 700;
}

:deep(.admin-menu-item:hover) {
  background: #f5f9ff;
}

:deep(.admin-menu-item--danger) {
  color: #c2413b;
}

:deep(.admin-menu-item--danger:hover) {
  background: #fff3f2;
}

.mobile-menu-button {
  display: none;
  color: #082b58;
}

/* Buscador y navegación móvil */
.mobile-header-extras {
  display: none;
  position: relative;
  z-index: 5;
  background: #fff;
  border-bottom: 1px solid #e8edf5;
}

.mobile-extras-container {
  padding-top: 10px;
  padding-bottom: 10px;
}

.mobile-search {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 4px 5px 4px 13px;
  border: 1px solid #e5ecf5;
  border-radius: 12px;
  background: #f5f8fc;
}

.mobile-search-icon {
  flex-shrink: 0;
  color: #f8f9fa;
}

.mobile-search-submit {
  flex-shrink: 0;
  height: 34px;
  padding: 0 13px;
  border: none;
  border-radius: 9px;
  background: #087df1;
  color: white;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}

.mobile-navigation {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  padding: 8px;
  border: 1px solid #e5ecf5;
  border-radius: 12px;
  background: #f8fbff;
}

.mobile-nav-button {
  justify-content: flex-start;
  color: #082b58;
  font-size: 13px;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}

.mobile-nav-button--active {
  color: #087df1;
  background: #eaf3ff;
}

.mobile-nav-button :deep(.v-btn__content) {
  justify-content: flex-start;
}

/* Login */
.admin-login-card {
  overflow: hidden;
}

.admin-login-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 10px;
  color: #082b58;
  font-size: 16px;
  font-weight: 750;
  white-space: normal;
}

.admin-login-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eaf3ff;
  color: #087df1;
}

.login-heading {
  min-width: 0;
}

.admin-login-subtitle {
  margin-top: 3px;
  color: #7b8ba3;
  font-size: 12px;
  font-weight: 400;
}

.admin-login-footer {
  padding-top: 0;
  padding-bottom: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
}

/* Pantallas medianas */
@media (max-width: 1100px) {
  .header-container {
    gap: 10px;
  }

  .store-logo-name {
    font-size: 19px;
  }

  .desktop-navigation {
    gap: 0;
  }

  .header-actions {
    gap: 3px;
  }
}

/* Tablet y móvil */
@media (max-width: 900px) {
  .header-container {
    gap: 8px;
  }

  .desktop-search,
  .desktop-navigation {
    display: none;
  }

  .header-actions {
    margin-left: auto;
  }

  .mobile-menu-button {
    display: inline-flex;
  }

  .mobile-header-extras {
    display: block;
    margin-top: 72px;
  }
}

/* Móviles pequeños */
@media (max-width: 600px) {
  .header-container {
    padding-left: 14px;
    padding-right: 14px;
  }

  .store-logo-name {
    font-size: 20px;
  }

  .store-logo-tagline {
    font-size: 10px;
  }

  .header-actions {
    gap: 0;
  }

  .header-action-button {
    width: 38px;
    height: 38px;
  }

  .mobile-extras-container {
    padding: 9px 14px;
  }

  .mobile-search {
    height: 42px;
  }

  .mobile-search-submit {
    height: 32px;
    padding: 0 10px;
  }

  .admin-login-title {
    gap: 9px;
    padding: 16px 16px 8px;
    font-size: 14px;
  }

  .admin-login-icon {
    width: 38px;
    height: 38px;
  }
}

/* Móviles muy estrechos */
@media (max-width: 360px) {
  .store-logo-name {
    font-size: 17px;
  }

  .header-container {
    padding-left: 10px;
    padding-right: 10px;
  }

  .header-action-button {
    width: 34px;
    height: 34px;
  }

  .mobile-extras-container {
    padding-left: 10px;
    padding-right: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .header-search {
    transition: none;
  }
}
</style>
