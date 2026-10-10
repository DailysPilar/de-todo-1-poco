
<script setup lang="ts">
import logo from '@/assets/branding/logo.png'
</script>

<template>
  <section class="hero-section">
    <v-container class="hero-container">
      <div class="hero-banner">
        <!-- Elementos decorativos -->
        <div class="hero-decoration hero-decoration-one"></div>
        <div class="hero-decoration hero-decoration-two"></div>

        <v-row align="center" class="hero-row">
          <!-- Contenido -->
          <v-col
            cols="12"
            md="7"
            class="hero-content"
          >
            <div class="hero-eyebrow">
              <v-icon
                icon="mdi-shopping-outline"
                size="16"
              />
              Tu tienda online en Cuba
            </div>

            <h1 class="hero-title">
              Lo que buscas,
              <span>en un solo lugar.</span>
            </h1>

            <p class="hero-description">
              Energía, tecnología, herramientas,
              electrodomésticos y mucho más. Descubre todo
              lo que tenemos para ti.
            </p>

            <div class="hero-actions">
              <v-btn
                to="/catalogo"
                color="secondary"
                size="large"
                rounded="lg"
                elevation="0"
                class="hero-button"
              >
                Explorar catálogo

                <v-icon
                  end
                  icon="mdi-arrow-up-right"
                />
              </v-btn>
            </div>
          </v-col>

          <!-- Logo de la tienda -->
          <v-col
            cols="12"
            md="5"
            class="hero-visual"
          >
            <div class="hero-logo-wrapper">
              <div class="hero-logo-glow"></div>

              <v-img
                :src="logo"
                alt="D'todo 1 poco"
                class="hero-logo"
                width="100%"
                max-width="280"
                contain
              />
            </div>
          </v-col>
        </v-row>
      </div>
    </v-container>
  </section>
</template>

<style scoped>
.hero-section {
  background: #f5f8fc;
  padding: 22px 0 8px;
}

.hero-container {
  padding-top: 0;
  padding-bottom: 0;
}

.hero-banner {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 26px;
  background: linear-gradient(
    115deg,
    #102d60 0%,
    #174b9a 58%,
    #2479ec 100%
  );
  box-shadow: 0 16px 40px rgba(16, 45, 96, 0.12);
}

.hero-row {
  position: relative;
  z-index: 2;
  margin: 0;
  min-height: 310px;
}

.hero-content {
  padding: 38px 30px 38px 48px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.1);
  color: #e6f0ff;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 17px;
}

.hero-title {
  color: white;
  font-size: clamp(32px, 3.4vw, 48px);
  line-height: 1.13;
  letter-spacing: -1.3px;
  font-weight: 850;
  max-width: 600px;
}

.hero-title span {
  display: block;
  color: #ffbf2e;
}

.hero-description {
  max-width: 470px;
  color: #d9e8ff;
  font-size: 15px;
  line-height: 1.65;
  margin-top: 16px;
  margin-bottom: 23px;
}

.hero-button {
  color: #102d60 !important;
  font-weight: 750;
  text-transform: none;
  letter-spacing: 0;
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px 24px;
}

.hero-logo-wrapper {
  position: relative;
  width: min(100%, 290px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-logo-glow {
  position: absolute;
  width: 90%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.13);
  filter: blur(30px);
}

.hero-logo {
  position: relative;
  z-index: 1;
  filter: drop-shadow(
    0 14px 20px rgba(0, 0, 0, 0.2)
  );
}

.hero-decoration {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.hero-decoration-one {
  width: 340px;
  height: 340px;
  right: -120px;
  top: -180px;
  background: rgba(255, 255, 255, 0.06);
}

.hero-decoration-two {
  width: 250px;
  height: 250px;
  left: 38%;
  bottom: -210px;
  background: rgba(255, 191, 46, 0.07);
}

@media (max-width: 959px) {
  .hero-content {
    padding: 32px 28px 12px;
  }

  .hero-visual {
    padding: 8px 20px 24px;
  }

  .hero-logo-wrapper {
    width: 205px;
  }

  .hero-row {
    min-height: auto;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 12px 0 0;
  }

  .hero-banner {
    border-radius: 18px;
  }

  .hero-content {
    padding: 26px 20px 4px;
  }

  .hero-eyebrow {
    font-size: 11px;
    margin-bottom: 13px;
  }

  .hero-title {
    font-size: clamp(29px, 8vw, 37px);
    letter-spacing: -0.8px;
  }

  .hero-description {
    font-size: 13px;
    margin-top: 13px;
    margin-bottom: 19px;
  }

  .hero-visual {
    padding: 8px 12px 18px;
  }

  .hero-logo-wrapper {
    width: 155px;
  }
}
</style>
