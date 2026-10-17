<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { TelegramLinkCode } from "../core/domain/telegramLink.js";
import { createTelegramLinkCodeUseCase } from "../core/usecases/createTelegramLinkCode.js";

const link = ref<TelegramLinkCode | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");
const copied = ref(false);
const now = ref(Date.now());

let ticker: ReturnType<typeof setInterval> | undefined;

const remainingSeconds = computed(() => {
  if (!link.value) return 0;
  return Math.max(0, Math.floor((new Date(link.value.expiresAt).getTime() - now.value) / 1000));
});
const isExpired = computed(() => link.value !== null && remainingSeconds.value === 0);
const countdown = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = String(remainingSeconds.value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
});
const displayCode = computed(() => (link.value ? `${link.value.code.slice(0, 4)}-${link.value.code.slice(4)}` : ""));
const botLink = computed(() =>
  link.value?.botUsername ? `https://t.me/${link.value.botUsername}?start=${link.value.code}` : "",
);

async function generate(): Promise<void> {
  errorMessage.value = "";
  copied.value = false;
  isLoading.value = true;
  try {
    link.value = await createTelegramLinkCodeUseCase.execute();
    now.value = Date.now();
    clearInterval(ticker);
    ticker = setInterval(() => {
      now.value = Date.now();
    }, 1000);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "No se pudo generar el código.";
  } finally {
    isLoading.value = false;
  }
}

async function copyCommand(): Promise<void> {
  if (!link.value) return;
  try {
    await navigator.clipboard.writeText(`/vincular ${link.value.code}`);
    copied.value = true;
  } catch {
    errorMessage.value = "No se pudo copiar; escríbelo a mano.";
  }
}

onBeforeUnmount(() => clearInterval(ticker));
</script>

<template>
  <section class="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-xl flex-col justify-center px-4 py-10">
    <div class="menu-panel">
      <header class="menu-title">
        <h1 class="ui-sign text-4xl leading-none text-[var(--l-ink)] md:text-5xl">Presenta a tu bot</h1>
        <p class="mt-3 text-base font-semibold text-[var(--l-muted)]">
          El bot no tiene contraseña. Genera un código y pásaselo antes de que se acabe el tiempo.
        </p>
      </header>

      <ol class="menu-quests" aria-label="Pasos">
        <li class="menu-quest" :class="{ 'is-done': link, 'is-active': !link }">
          <span class="menu-badge menu-badge-sun">{{ link ? "OK" : "1" }}</span>
          <p>Genera un código.</p>
        </li>
        <li class="menu-quest" :class="{ 'is-active': link && !isExpired }">
          <span class="menu-badge menu-badge-rose">2</span>
          <p>Abre el chat del bot en Telegram.</p>
        </li>
        <li class="menu-quest" :class="{ 'is-active': link && !isExpired }">
          <span class="menu-badge menu-badge-lilac">3</span>
          <p>Envíale <code>/vincular</code> con tu código.</p>
        </li>
      </ol>

      <div v-if="link" class="menu-code" :class="{ 'is-expired': isExpired }">
        <p class="menu-label">Tu código</p>
        <div class="menu-tiles" aria-live="polite" :aria-label="displayCode">
          <template v-for="(char, index) in displayCode" :key="index">
            <span v-if="char === '-'" class="menu-dash" aria-hidden="true">-</span>
            <span v-else class="menu-tile" aria-hidden="true">{{ char }}</span>
          </template>
        </div>
        <div class="menu-bar" role="progressbar" aria-valuemin="0" aria-valuemax="300" :aria-valuenow="remainingSeconds">
          <span class="menu-bar-fill" :style="{ width: `${Math.min(remainingSeconds / 3, 100)}%` }" />
        </div>
        <p class="menu-time">{{ isExpired ? "Este código ya venció. Genera uno nuevo." : `Vence en ${countdown}` }}</p>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost" :disabled="isExpired" @click="copyCommand">
            {{ copied ? "Copiado" : "Copiar el comando" }}
          </button>
          <a
            v-if="botLink && !isExpired"
            :href="botLink"
            target="_blank"
            rel="noopener noreferrer"
            class="ui-btn ui-btn-sm ui-btn-primary"
          >
            Abrir el bot
          </a>
        </div>
      </div>

      <p v-if="errorMessage" role="alert" class="ui-error mt-4 text-center">{{ errorMessage }}</p>

      <button type="button" class="ui-btn ui-btn-primary menu-start" :disabled="isLoading" @click="generate">
        {{ isLoading ? "Generando..." : link ? "Generar un código nuevo" : "Generar código" }}
      </button>

      <p class="menu-note">Cada código sirve una sola vez. Si cierras sesión o cambias tu contraseña, el bot pierde el acceso.</p>
    </div>
  </section>
</template>

<style scoped>
.menu-quests {
  display: grid;
  gap: 0.75rem;
}
.menu-quest {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.7rem 0.9rem;
  border-radius: 18px;
  border: 3px solid var(--l-toy-edge);
  background: var(--l-bg);
  font-weight: 800;
  opacity: 0.7;
  transition: transform 0.25s, opacity 0.25s, border-color 0.25s;
}
.menu-quest.is-active {
  opacity: 1;
  border-color: var(--l-accent);
  transform: translateX(6px);
}
.menu-quest.is-done {
  opacity: 1;
  border-color: #6fcf97;
}
.menu-code {
  margin-top: 1.25rem;
  padding: 1.1rem 1rem;
  border-radius: 22px;
  border: 3px dashed var(--l-accent);
  text-align: center;
}
.menu-code.is-expired { opacity: 0.6; border-color: var(--l-danger); }
.menu-tiles {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  margin: 0.7rem 0;
}
.menu-tile {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 3.2rem;
  border-radius: 14px;
  background: #ffe98a;
  border: 3px solid var(--l-ink);
  box-shadow: 0 4px 0 #d9b93a;
  color: #2a1730;
  font-family: var(--l-display);
  font-size: 1.6rem;
  animation: tile-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.menu-tile:nth-child(2) { animation-delay: 0.05s; }
.menu-tile:nth-child(3) { animation-delay: 0.1s; }
.menu-tile:nth-child(4) { animation-delay: 0.15s; }
.menu-tile:nth-child(6) { animation-delay: 0.2s; }
.menu-tile:nth-child(7) { animation-delay: 0.25s; }
.menu-tile:nth-child(8) { animation-delay: 0.3s; }
.menu-tile:nth-child(9) { animation-delay: 0.35s; }
.menu-dash { font-family: var(--l-display); font-size: 1.4rem; color: var(--l-muted); }
.menu-bar {
  height: 0.9rem;
  margin: 0.4rem auto 0;
  max-width: 18rem;
  overflow: hidden;
  border-radius: 999px;
  border: 3px solid var(--l-ink);
  background: var(--l-bg);
}
.menu-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6fcf97, #ffe98a);
  transition: width 1s linear;
}
.menu-time { margin-top: 0.5rem; font-size: 0.85rem; font-weight: 800; }
.menu-start { width: 100%; margin-top: 1.4rem; justify-content: center; }
.menu-note {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--l-muted);
}
@keyframes tile-pop {
  from { opacity: 0; transform: translateY(14px) scale(0.6); }
}
@media (prefers-reduced-motion: reduce) {
  .menu-tile { animation: none; }
  .menu-quest, .menu-bar-fill { transition: none; }
}
</style>
