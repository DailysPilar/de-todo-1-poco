
<script setup lang="ts">
import logo from '@/assets/branding/logo.png'
</script>

<template>
  <section class="hero-section">
    <v-container class="hero-container">
      <div class="hero-banner">
        <div class="hero-decoration hero-decoration-one"></div>
        <div class="hero-decoration hero-decoration-two"></div>

        <div class="hero-main">
          <div class="hero-content">
            <div class="hero-eyebrow">
              <v-icon icon="mdi-shopping-outline" size="16" />
              Tu tienda online en Cuba
            </div>

            <h1 class="hero-title">
              Lo que buscas,
              <span>en un solo lugar.</span>
            </h1>

            <p class="hero-description">
              Energía, tecnología, herramientas,
              electrodomésticos y mucho más.
              Descubre todo lo que tenemos para ti.
            </p>
          </div>

          <div class="hero-visual">
            <div id="home-hero-logo" class="hero-logo-wrapper">
              <div class="hero-logo-glow"></div>
              <v-img
                :src="logo"
                alt="D'todo 1 poco"
                class="hero-logo"
                width="100%"
                contain
              />
            </div>
          </div>
        </div>

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
            <v-icon end icon="mdi-arrow-up-right" />
          </v-btn>
        </div>
      </div>
    </v-container>
  </section>
</template>

<style scoped>
.hero-section {
  background: #f5f8fc;
  padding: 16px 0 8px;
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
  padding: 38px 48px;
  animation: hero-banner-enter 800ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.hero-main {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  align-items: center;
  gap: 24px;
}

.hero-content {
  min-width: 0;
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
  animation: hero-content-enter 650ms 180ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.hero-title {
  color: white;
  font-size: clamp(32px, 3.4vw, 48px);
  line-height: 1.13;
  letter-spacing: -1.3px;
  font-weight: 850;
  max-width: 600px;
  animation: hero-content-enter 700ms 300ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
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
  margin-bottom: 0;
  animation: hero-content-enter 700ms 430ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.hero-logo-wrapper {
  position: relative;
  width: min(100%, 290px);
  display: flex;
  justify-content: center;
  align-items: center;
  animation:
    hero-logo-enter 900ms 250ms cubic-bezier(0.16, 1, 0.3, 1) both,
    hero-logo-float 4s 1.2s ease-in-out infinite;
}

.hero-logo-glow {
  position: absolute;
  width: 90%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.13);
  filter: blur(30px);
  animation: hero-glow-pulse 3s 1.2s ease-in-out infinite alternate;
}

.hero-logo {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.2));
}

.hero-actions {
  position: relative;
  z-index: 2;
  margin-top: 24px;
  animation: hero-content-enter 700ms 560ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.hero-button {
  color: #102d60 !important;
  font-weight: 750;
  text-transform: none;
  letter-spacing: 0;
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
  animation: hero-decoration-drift 12s ease-in-out infinite alternate;
}

.hero-decoration-two {
  width: 250px;
  height: 250px;
  left: 38%;
  bottom: -210px;
  background: rgba(255, 191, 46, 0.07);
  animation: hero-decoration-drift 15s -3s ease-in-out infinite alternate-reverse;
}

@keyframes hero-banner-enter {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes hero-content-enter {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-logo-enter {
  from {
    opacity: 0;
    transform: translateX(36px) scale(0.78);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes hero-logo-float {
  0%,
  100% {
    translate: 0 0;
  }

  50% {
    translate: 0 -10px;
  }
}

@keyframes hero-glow-pulse {
  from {
    opacity: 0.65;
    scale: 0.9;
  }

  to {
    opacity: 1;
    scale: 1.12;
  }
}

@keyframes hero-decoration-drift {
  from {
    transform: translate3d(-8px, 6px, 0) scale(0.96);
  }

  to {
    transform: translate3d(12px, -10px, 0) scale(1.05);
  }
}

@media (max-width: 959px) {
  .hero-banner {
    padding: 28px;
  }

  .hero-main {
    grid-template-columns: minmax(0, 1fr) 190px;
    gap: 12px;
  }

  .hero-title {
    font-size: 35px;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 4px 0 0;
  }

  .hero-banner {
    padding: 18px 16px;
    border-radius: 16px;
  }

  .hero-main {
    grid-template-columns: minmax(0, 1fr) 130px;
    gap: 8px;
  }

  .hero-eyebrow {
    gap: 4px;
    padding: 5px 8px;
    font-size: 9px;
    margin-bottom: 10px;
  }

  .hero-title {
    font-size: clamp(21px, 6vw, 29px);
    line-height: 1.17;
    letter-spacing: -0.6px;
  }

  .hero-description {
    font-size: 11px;
    line-height: 1.5;
    margin-top: 9px;
  }

  .hero-logo-wrapper {
    width: 100%;
    max-width: 130px;
  }

  .hero-actions {
    margin-top: 14px;
  }

  .hero-button {
    width: 100%;
    height: 40px !important;
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .hero-main {
    grid-template-columns: minmax(0, 1fr) 96px;
  }

  .hero-title {
    font-size: 20px;
  }

  .hero-eyebrow {
    font-size: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-banner,
  .hero-eyebrow,
  .hero-title,
  .hero-description,
  .hero-logo-wrapper,
  .hero-logo-glow,
  .hero-actions,
  .hero-decoration {
    animation: none;
  }
}
</style>
