
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

import { computed, onMounted, ref } from 'vue'
import {
  getStoreWhatsAppNumber,
  getStoreFacebookUrl,
} from '@/api/settings'
import { buildGeneralWhatsAppUrl } from '@/lib/whatsapp'

const footerWhatsAppNumber = ref<string | null>(null)
const footerFacebookUrl = ref<string | null>(null)

const footerWhatsAppUrl = computed(() => {
  if (!footerWhatsAppNumber.value) return undefined

  return buildGeneralWhatsAppUrl(footerWhatsAppNumber.value)
})

async function loadFooterSocialLinks() {
  const [whatsappResult, facebookResult] =
    await Promise.allSettled([
      getStoreWhatsAppNumber(),
      getStoreFacebookUrl(),
    ])

  footerWhatsAppNumber.value =
    whatsappResult.status === 'fulfilled'
      ? whatsappResult.value
      : null

  footerFacebookUrl.value =
    facebookResult.status === 'fulfilled'
      ? facebookResult.value
      : null

  if (whatsappResult.status === 'rejected') {
    console.error(
      'Error cargando WhatsApp del footer:',
      whatsappResult.reason,
    )
  }

  if (facebookResult.status === 'rejected') {
    console.error(
      'Error cargando Facebook del footer:',
      facebookResult.reason,
    )
  }
}

onMounted(loadFooterSocialLinks)

// Configuraremos los enlaces reales más adelante.
const whatsappNumber = ''
const facebookUrl = ''

const whatsappUrl = computed(() => {
  if (!whatsappNumber) return ''

  const message = encodeURIComponent(
    "¡Hola! Estoy visitando D' todo 1 poco y quisiera información.",
  )

  return `https://wa.me/${whatsappNumber}?text=${message}`
})

function goToCategories() {
  router.push({
    path: '/',
    hash: '#categorias',
  })
}
</script>

<template>
  <footer class="store-footer">
    <v-container>
      <v-row class="footer-content">
        <!-- Marca -->
        <v-col cols="12" md="5">
          <router-link to="/" class="footer-logo">
            D' todo <span>1 poco</span>
          </router-link>

          <p class="footer-tagline">
            De todo para ti.
          </p>

          <p class="footer-description">
            Energía, tecnología, ferretería,
            electrodomésticos, vehículos y mucho más.
          </p>

          <div class="footer-socials">
            <v-btn
              :href="footerWhatsAppUrl"
              :disabled="!footerWhatsAppUrl"
              target="_blank"
              rel="noopener noreferrer"
              icon="mdi-whatsapp"
              variant="tonal"
              color="success"
              aria-label="WhatsApp"
              size="small"
            />

            <v-btn
              :href="footerFacebookUrl || undefined"
              :disabled="!footerFacebookUrl"
              target="_blank"
              rel="noopener noreferrer"
              icon="mdi-facebook"
              variant="tonal"
              color="white"
              aria-label="Facebook"
              size="small"
            />
          </div>
        </v-col>

        <!-- Navegación -->
        <v-col cols="6" md="3">
          <h3 class="footer-heading">
            Explorar
          </h3>

          <div class="footer-links">
            <router-link to="/">
              Inicio
            </router-link>

            <router-link to="/catalogo">
              Catálogo
            </router-link>

            <button
              type="button"
              @click="goToCategories"
            >
              Categorías
            </button>
          </div>
        </v-col>

        <!-- Contacto -->
        <v-col cols="6" md="4">
          <h3 class="footer-heading">
            ¿Necesitas ayuda?
          </h3>

          <p class="footer-help">
            ¿Tienes dudas sobre algún producto?
            Escríbenos y te ayudaremos.
          </p>

          <v-btn
            v-if="whatsappUrl"
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            color="secondary"
            rounded="lg"
            elevation="0"
            class="contact-button"
          >
            <v-icon start icon="mdi-whatsapp" />
            Escríbenos
          </v-btn>

          <p v-else class="footer-contact-pending">
            Próximamente habilitaremos
            nuestro contacto directo.
          </p>
        </v-col>
      </v-row>

      <div class="footer-bottom">
        <span>
          © {{ new Date().getFullYear() }}
          D'todo 1 poco.
          Todos los derechos reservados.
        </span>

        <span>

          <v-icon
            icon="mdi-heart"
            size="13"
            color="#FFBF2E"
          />
        </span>
      </div>
    </v-container>
  </footer>
</template>

<style scoped>
.store-footer {
  background: #082b58;
  color: white;
  padding: 42px 0 18px;
}

.footer-content {
  padding-bottom: 30px;
}

.footer-logo {
  display: inline-block;
  color: white;
  text-decoration: none;
  font-size: 25px;
  font-weight: 850;
  letter-spacing: -0.8px;
}

.footer-logo span {
  color: #ffbf2e;
}

.footer-tagline {
  color: #ffbf2e;
  font-size: 12px;
  font-weight: 700;
  margin-top: 4px;
}

.footer-description {
  color: #c5d6ea;
  font-size: 13px;
  line-height: 1.7;
  max-width: 340px;
  margin-top: 14px;
}

.footer-socials {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.footer-heading {
  color: white;
  font-size: 15px;
  font-weight: 750;
  margin-bottom: 16px;
}

.footer-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.footer-links a,
.footer-links button {
  color: #c5d6ea;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.footer-links button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.footer-links a:hover,
.footer-links button:hover {
  color: #ffbf2e;
}

.footer-help {
  color: #c5d6ea;
  font-size: 13px;
  line-height: 1.7;
  max-width: 280px;
  margin-bottom: 16px;
}

.contact-button {
  color: #082b58 !important;
  text-transform: none;
  font-weight: 700;
}

.footer-contact-pending {
  color: #8fa9c8;
  font-size: 12px;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: #9fb6d2;
  font-size: 11px;
}

@media (max-width: 600px) {
  .store-footer {
    padding: 32px 0 18px;
  }

  .footer-content {
    padding-bottom: 20px;
  }

  .footer-logo {
    font-size: 23px;
  }

  .footer-heading {
    margin-bottom: 12px;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>
