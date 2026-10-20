<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { NAV_ITEMS, PULL_FEEDBACK_MS } from "../constantes/nav_constantes.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";
import { useHeightVar } from "../composables/useHeightVar.js";
import { useTheme } from "../composables/useTheme.js";
import AppLogoBadge from "./AppLogoBadge.vue";

const router = useRouter();
const header = ref<HTMLElement | null>(null);
useHeightVar(header, "--header-h");
const { isDark, toggle: toggleTheme } = useTheme();
const pulled = ref(false);

async function handleLogout(): Promise<void> {
  await authenticatedHttpClient.logout();
  router.push("/login");
}

function pullChain(): void {
  toggleTheme();
  pulled.value = true;
  setTimeout(() => {
    pulled.value = false;
  }, PULL_FEEDBACK_MS);
}
</script>

<template>
  <header ref="header" class="shop-header sticky top-0 z-20 px-3 pt-2" style="font-family: var(--l-font)">
    <div class="shopfront mx-auto max-w-7xl">
      <div class="awning" aria-hidden="true" />

      <div class="rail">
        <router-link to="/" class="sign sign-brand" style="--i: 0; font-family: var(--l-display)" aria-label="Guardacosas, ir al inicio">
          <AppLogoBadge />
          <span class="sign-name">Guardacosas</span>
        </router-link>

        <div class="rail-right">
          <nav v-if="authenticatedHttpClient.isAuthenticated()" class="signs" aria-label="Principal">
            <router-link
              v-for="(item, index) in NAV_ITEMS"
              :key="item.to"
              :to="item.to"
              class="sign"
              :style="{ '--i': index + 1, '--tone': item.tone }"
              :aria-label="item.title"
              :title="item.title"
            >
              <span class="sign-star" aria-hidden="true" />
              <span class="menu-badge"><font-awesome-icon :icon="item.icon" /></span>
              <span class="sign-label">{{ item.label }}</span>
            </router-link>
          </nav>

          <button
            type="button"
            role="switch"
            class="pull"
            :class="{ 'is-pulled': pulled, 'is-night': isDark }"
            :aria-checked="isDark"
            :aria-label="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            :title="isDark ? 'Jala la cadena: que salga el sol' : 'Jala la cadena: que llegue la noche'"
            @click="pullChain"
          >
            <span class="pull-chain" aria-hidden="true" />
            <span class="pull-knob"><font-awesome-icon :icon="isDark ? 'moon' : 'sun'" /></span>
          </button>

          <button
            v-if="authenticatedHttpClient.isAuthenticated()"
            type="button"
            class="sign sign-exit"
            style="--i: 7"
            aria-label="Salir"
            title="Cerrar la juguetería"
            @click="handleLogout"
          >
            <font-awesome-icon icon="door-open" />
            <span class="sign-label sign-label-exit">Salir</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.shop-header {
  --string: 1.15rem;
  pointer-events: none;
}

.awning {
  position: relative;
  z-index: 2;
  height: 1rem;
  border: 4px solid var(--l-ink);
  border-bottom: 0;
  border-radius: 22px 22px 0 0;
  background: repeating-linear-gradient(90deg, var(--l-accent) 0 1.5rem, var(--l-surface-2) 1.5rem 3rem);
  box-shadow: inset 0 3px 0 rgb(255 255 255 / 0.28);
}
.awning::after {
  content: "";
  position: absolute;
  left: -4px;
  right: -4px;
  top: calc(100% - 1px);
  height: 0.8rem;
  background:
    radial-gradient(circle at 0.75rem 0, var(--l-accent) calc(0.75rem - 3px), var(--l-ink) calc(0.75rem - 3px) 0.75rem, transparent calc(0.75rem + 0.5px)) 0 0 / 3rem 0.8rem repeat-x,
    radial-gradient(circle at 2.25rem 0, var(--l-surface-2) calc(0.75rem - 3px), var(--l-ink) calc(0.75rem - 3px) 0.75rem, transparent calc(0.75rem + 0.5px)) 0 0 / 3rem 0.8rem repeat-x;
}

.rail {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 0.9rem;
}
.rail-right {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
}
.signs {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
}

.sign {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: calc(var(--string) - 0.05rem);
  padding: 0.3rem 0.4rem;
  border: 3px solid var(--l-ink);
  border-radius: 14px 14px 20px 20px;
  background: var(--l-surface);
  color: var(--l-ink);
  box-shadow: 0 4px 0 var(--l-toy-edge);
  pointer-events: auto;
  transform-origin: 50% calc(-1 * var(--string));
  animation: sign-sway 6s ease-in-out infinite;
  animation-delay: calc(var(--i) * -1.3s);
  transition: background-color 0.25s, margin-top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sign::before,
.sign::after {
  content: "";
  position: absolute;
  bottom: calc(100% + 1px);
  width: 3px;
  height: var(--string);
  background: var(--l-ink);
}
.sign::before { left: 22%; }
.sign::after { right: 22%; }

.sign:hover,
.sign:focus-visible {
  animation: sign-swing 0.9s ease-out;
}
.sign:focus-visible {
  outline: 3px solid var(--l-ink);
  outline-offset: 3px;
}

.sign .menu-badge {
  width: 2rem;
  height: 2rem;
  background: var(--tone);
  font-size: 0.85rem;
  box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.5);
}
.sign-label {
  display: none;
  padding-right: 0.3rem;
  font-size: 0.8rem;
  font-weight: 900;
  line-height: 1;
}

.sign.router-link-active {
  margin-top: calc(var(--string) + 0.3rem);
  background: color-mix(in srgb, var(--tone) 55%, var(--l-surface));
  outline: 3px dashed color-mix(in srgb, var(--l-ink) 35%, transparent);
  outline-offset: -8px;
}
.sign.router-link-active::before,
.sign.router-link-active::after {
  height: calc(var(--string) + 0.3rem);
}
.sign-star {
  position: absolute;
  top: -0.35rem;
  right: -0.45rem;
  display: none;
  width: 1rem;
  height: 1rem;
  background: #ffe35c;
  clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  animation: sign-twinkle 2.2s ease-in-out infinite;
}
.router-link-active .sign-star {
  display: block;
}

.sign-brand {
  margin-top: calc(var(--string) - 0.05rem);
  padding: 0.15rem 0.5rem 0.15rem 0.3rem;
  transform: rotate(-1.5deg);
  font-size: 1.25rem;
}
.sign-brand .sign-name {
  white-space: nowrap;
}
.sign-brand:hover :deep(canvas) {
  transform: rotate(-10deg) scale(1.1);
}
.sign-brand :deep(canvas) {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sign-exit {
  padding: 0.55rem 0.8rem;
  background: var(--l-accent);
  color: var(--l-on-accent);
  box-shadow: 0 4px 0 var(--l-accent-edge);
}
.sign-exit .sign-label-exit {
  padding-right: 0;
}

.pull {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.1rem;
  padding: 0 0.35rem;
  pointer-events: auto;
  transform-origin: 50% 0;
}
.pull:focus-visible {
  outline: 3px solid var(--l-ink);
  outline-offset: 2px;
  border-radius: 14px;
}
.pull-chain {
  width: 0.45rem;
  height: 2.6rem;
  background: radial-gradient(circle, var(--l-ink) 0.13rem, transparent 0.15rem) 50% 0 / 0.45rem 0.5rem repeat-y;
}
.pull-knob {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border: 3px solid var(--l-ink);
  border-radius: 999px;
  background: #ffe35c;
  color: #2a1730;
  font-size: 0.9rem;
  box-shadow: 0 4px 0 var(--l-toy-edge), inset 0 2px 0 rgb(255 255 255 / 0.6);
  transition: background-color 0.35s;
}
.pull.is-night .pull-knob {
  background: #fff0f6;
}
.pull:hover .pull-knob {
  transform: translateY(2px);
}
.pull.is-pulled {
  animation: chain-pull 0.52s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (min-width: 640px) {
  .sign { padding: 0.35rem 0.5rem; }
  .sign-brand { padding: 0.2rem 0.9rem 0.2rem 0.4rem; }
}
@media (min-width: 900px) {
  .sign.router-link-active .sign-label {
    display: block;
  }
}
@media (min-width: 1100px) {
  .sign:not(.sign-brand) .sign-label {
    display: block;
  }
}
@media (max-width: 639px) {
  .shop-header { padding-left: 0.4rem; padding-right: 0.4rem; }
  .rail {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 0 0.3rem;
    padding: 0 0.5rem;
  }
  .rail-right { display: contents; }
  .sign-brand { padding: 0.1rem 0.6rem 0.1rem 0.25rem; font-size: 1.1rem; }
  .pull { order: 1; margin-left: auto; }
  .sign-exit { order: 2; padding: 0.55rem 0.65rem; }
  .pull-chain { height: 1.8rem; }
  .pull-knob { width: 2.1rem; height: 2.1rem; }
  .signs {
    --string: 0.75rem;
    position: relative;
    order: 3;
    flex: 0 0 100%;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 0.2rem;
  }
  .signs::before {
    content: "";
    position: absolute;
    top: -2px;
    right: 0;
    left: 0;
    height: 0.6rem;
    background:
      radial-gradient(circle at 0.3rem 0.3rem, var(--l-ink) 0.28rem, transparent 0.3rem),
      radial-gradient(circle at calc(100% - 0.3rem) 0.3rem, var(--l-ink) 0.28rem, transparent 0.3rem),
      linear-gradient(var(--l-ink), var(--l-ink)) 0 0.15rem / 100% 3px no-repeat;
  }
  .sign .menu-badge { width: 2.2rem; height: 2.2rem; font-size: 0.85rem; }
}

@keyframes sign-sway {
  0%, 100% { transform: rotate(-1.1deg); }
  50% { transform: rotate(1.1deg); }
}
@keyframes sign-swing {
  0% { transform: rotate(0); }
  20% { transform: rotate(-8deg); }
  45% { transform: rotate(6deg); }
  70% { transform: rotate(-3deg); }
  100% { transform: rotate(0); }
}
@keyframes sign-twinkle {
  50% { opacity: 0.5; transform: scale(0.8) rotate(12deg); }
}
@keyframes chain-pull {
  35% { transform: translateY(0.9rem); }
  65% { transform: translateY(-0.2rem); }
}
@media (prefers-reduced-motion: reduce) {
  .sign, .sign:hover, .sign:focus-visible, .sign-star, .pull.is-pulled { animation: none; }
  .sign, .sign-brand :deep(canvas), .pull-knob { transition: none; }
}
</style>
