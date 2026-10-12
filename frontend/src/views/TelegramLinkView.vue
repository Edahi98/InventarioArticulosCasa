<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { TelegramLinkCode } from "../core/domain/telegramLink.js";
import { createTelegramLinkCodeUseCase } from "../core/usecases/createTelegramLinkCode.js";
import PageHeader from "../components/ui/PageHeader.vue";

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
  <section class="mx-auto max-w-4xl px-4 py-12 md:px-8">
    <PageHeader
      title="Presenta a tu bot"
      subtitle="El bot no tiene contraseña. Tú inicias sesión aquí y le pasas un código que dura 5 minutos."
    />

    <div class="grid grid-cols-1 gap-10 md:grid-cols-12">
      <ol class="space-y-5 md:col-span-5">
        <li class="flex gap-4">
          <span class="ui-chip ui-chip-sun h-8 w-8 shrink-0 justify-center">1</span>
          <p class="text-lg font-semibold leading-snug">Genera un código aquí abajo.</p>
        </li>
        <li class="flex gap-4">
          <span class="ui-chip ui-chip-rose h-8 w-8 shrink-0 justify-center">2</span>
          <p class="text-lg font-semibold leading-snug">Ábrele el chat al bot en Telegram.</p>
        </li>
        <li class="flex gap-4">
          <span class="ui-chip ui-chip-lilac h-8 w-8 shrink-0 justify-center">3</span>
          <p class="text-lg font-semibold leading-snug">Envíale el comando <code>/vincular</code> con tu código.</p>
        </li>
      </ol>

      <div class="space-y-6 md:col-span-7">
        <button type="button" class="ui-btn ui-btn-primary" :disabled="isLoading" @click="generate">
          {{ isLoading ? "Generando..." : link ? "Generar un código nuevo" : "Generar código" }}
        </button>

        <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

        <div v-if="link" class="ui-postit -rotate-1 bg-[#ffe98a] px-8 py-10 text-center">
          <p class="text-sm font-extrabold uppercase opacity-70">Tu código</p>
          <p class="mt-2 break-all text-5xl leading-none" style="font-family: var(--l-display)" aria-live="polite">
            {{ displayCode }}
          </p>
          <p class="mt-4 text-sm font-semibold" :class="{ 'text-[var(--l-danger)]': isExpired }">
            {{ isExpired ? "Este código ya venció. Genera uno nuevo." : `Vence en ${countdown}` }}
          </p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
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

        <p class="text-sm leading-relaxed text-[var(--l-muted)]">
          Cada código sirve una sola vez. Si cierras sesión en la web o cambias tu contraseña, el bot también pierde el acceso.
        </p>
      </div>
    </div>
  </section>
</template>
