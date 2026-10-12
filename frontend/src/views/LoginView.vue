<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { listPeekBears } from "../core/usecases/listHomeBears.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";
import type { LoginMood } from "../infrastructure/three/LoginStage.js";
import BearPeekScene from "../components/BearPeekScene.vue";
import { loginForm } from "../validators/userValidators.js";
import { validateInput } from "../validators/validateInput.js";

const SAD_MILLISECONDS = 2600;
const HAPPY_MILLISECONDS = 900;

const router = useRouter();
const route = useRoute();

const bears = listPeekBears();

const form = reactive({
  username: "",
  password: "",
});

const isSubmitting = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string>>({});
const usernameFocused = ref(false);
const passwordFocused = ref(false);
const showPassword = ref(false);
const mood = ref<LoginMood>("idle");

let moodTimer: ReturnType<typeof setTimeout> | undefined;

const gazeX = computed(() => {
  if (!usernameFocused.value) return 0;
  return Math.min(form.username.length / 14, 1) * 1.6 - 0.8;
});
const covering = computed(() => passwordFocused.value && !showPassword.value);

function setMood(next: LoginMood, after: () => void = () => undefined, delay = 0): void {
  clearTimeout(moodTimer);
  mood.value = next;
  if (delay === 0) return;
  moodTimer = setTimeout(after, delay);
}

async function handleSubmit(): Promise<void> {
  errorMessage.value = "";
  fieldErrors.value = {};

  const checked = validateInput(loginForm, { username: form.username, password: form.password });
  if (!checked.ok) {
    fieldErrors.value = checked.failure.fields;
    errorMessage.value = checked.failure.message;
    setMood("sad", () => setMood("idle"), SAD_MILLISECONDS);
    return;
  }

  isSubmitting.value = true;
  try {
    await authenticatedHttpClient.login(checked.data.username, checked.data.password);
    const redirectTo = (route.query.redirect as string) || "/categories";
    setMood("happy", () => router.push(redirectTo), HAPPY_MILLISECONDS);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "No se pudo iniciar sesión.";
    setMood("sad", () => setMood("idle"), SAD_MILLISECONDS);
  } finally {
    isSubmitting.value = false;
  }
}

onBeforeUnmount(() => clearTimeout(moodTimer));
</script>

<template>
  <section
    class="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-[var(--l-bg)] px-4 py-10 text-[var(--l-ink)]"
    style="font-family: var(--l-font)"
  >
    <div class="w-full max-w-lg">
      <div class="-mb-[72px] h-[250px] w-full">
        <BearPeekScene :bears="bears" :gaze-x="gazeX" :covering="covering" :mood="mood" />
      </div>

      <div class="ui-toy ui-stitch relative bg-[var(--l-surface)] p-6 sm:p-9">
        <h1 class="ui-sign text-4xl">¡Hola de nuevo!</h1>
        <p class="mt-2 text-base leading-relaxed text-[var(--l-muted)]">
          Los ositos dejaron todo en su lugar. Inicia sesión para verlo.
        </p>

        <form class="mt-6 flex flex-col gap-5" @submit.prevent="handleSubmit">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold" for="username">Usuario</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              autocomplete="username"
              class="login-input"
              placeholder="tu usuario"
              @focus="usernameFocused = true"
              @blur="usernameFocused = false"
            />
            <p v-if="fieldErrors.username" role="alert" class="ui-error">El usuario {{ fieldErrors.username }}.</p>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-semibold" for="password">Contraseña</label>
              <button
                type="button"
                class="rounded-[var(--l-radius)] px-2 py-1 text-sm font-semibold text-[var(--l-muted)] hover:text-[var(--l-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--l-accent)]"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Ocultar" : "Mostrar" }}
              </button>
            </div>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              class="login-input"
              placeholder="tu contraseña"
              @focus="passwordFocused = true"
              @blur="passwordFocused = false"
            />
            <p v-if="fieldErrors.password" role="alert" class="ui-error">La contraseña {{ fieldErrors.password }}.</p>
          </div>

          <p v-if="errorMessage" role="alert" class="text-sm font-semibold text-[var(--l-accent)]">
            {{ errorMessage }}
          </p>

          <button type="submit" :disabled="isSubmitting" class="ui-btn ui-btn-primary w-full disabled:opacity-60">
            {{ isSubmitting ? "Entrando..." : "Entrar" }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-input {
  width: 100%;
  border-radius: var(--l-radius);
  border: 2px solid var(--l-surface-2);
  background: var(--l-bg);
  color: var(--l-ink);
  padding: 0.8rem 1rem;
  outline: none;
  transition: border-color 160ms ease;
}

.login-input::placeholder {
  color: var(--l-muted);
}

.login-input:focus {
  border-color: var(--l-accent);
}
</style>
