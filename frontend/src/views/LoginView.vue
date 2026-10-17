<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { listPeekBears } from "../core/usecases/listHomeBears.js";
import { LOGIN_HAPPY_MS, LOGIN_SAD_MS } from "../constantes/ui_constantes.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";
import { useFormSubmit } from "../composables/useFormSubmit.js";
import { useTimedMood } from "../composables/useTimedMood.js";
import BearPeekScene from "../components/BearPeekScene.vue";
import MenuBackdrop from "../components/ui/MenuBackdrop.vue";
import { loginForm } from "../validators/userValidators.js";

const router = useRouter();
const route = useRoute();

const bears = listPeekBears();
const celebrations = ref(0);

const form = reactive({
  username: "",
  password: "",
});

const usernameFocused = ref(false);
const passwordFocused = ref(false);
const showPassword = ref(false);

const { isSubmitting, errorMessage, fieldErrors, validate, submit } = useFormSubmit();
const { mood, setMood } = useTimedMood();

const gazeX = computed(() => {
  if (!usernameFocused.value) return 0;
  return Math.min(form.username.length / 14, 1) * 1.6 - 0.8;
});
const covering = computed(() => passwordFocused.value && !showPassword.value);

async function handleSubmit(): Promise<void> {
  const data = validate(loginForm, { username: form.username, password: form.password });
  if (!data) {
    setMood("sad", () => setMood("idle"), LOGIN_SAD_MS);
    return;
  }

  const loggedIn = await submit(async () => {
    await authenticatedHttpClient.login(data.username, data.password);
  }, "No se pudo iniciar sesión.");
  if (!loggedIn) {
    setMood("sad", () => setMood("idle"), LOGIN_SAD_MS);
    return;
  }

  const redirectTo = (route.query.redirect as string) || "/categories";
  celebrations.value += 1;
  setMood("happy", () => router.push(redirectTo), LOGIN_HAPPY_MS);
}
</script>

<template>
  <section
    class="relative isolate -mt-16 flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pb-10 pt-24 text-[var(--l-ink)]"
    style="font-family: var(--l-font)"
  >
    <MenuBackdrop scene="casa" :celebrate="celebrations" class="absolute inset-0 z-0" />

    <div class="relative z-[1] w-full max-w-md">
      <div class="-mb-[72px] h-[220px] w-full">
        <BearPeekScene :bears="bears" :gaze-x="gazeX" :covering="covering" :mood="mood" />
      </div>

      <div class="menu-panel !pt-8">
        <header class="menu-title">
          <h1 class="ui-sign text-4xl leading-none md:text-5xl">Guardacosas</h1>
        </header>
        <p class="menu-label text-center">Menú principal</p>
        <p class="mt-2 text-center font-semibold text-[var(--l-muted)]">
          Los ositos dejaron todo en su lugar. Inicia sesión para verlo.
        </p>

        <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div class="flex flex-col gap-2">
            <label class="menu-label" for="username">Usuario</label>
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
              <label class="menu-label" for="password">Contraseña</label>
              <button
                type="button"
                class="rounded-[var(--l-radius)] px-2 py-1 text-sm font-extrabold text-[var(--l-muted)] hover:text-[var(--l-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--l-accent)]"
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

          <button type="submit" :disabled="isSubmitting" class="ui-btn ui-btn-primary mt-1 w-full justify-center disabled:opacity-60">
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
  border-radius: 18px;
  border: 3px solid var(--l-toy-edge);
  background: var(--l-bg);
  color: var(--l-ink);
  font-weight: 700;
  padding: 0.8rem 1rem;
  outline: none;
  transition: border-color 160ms ease, transform 160ms ease;
}

.login-input::placeholder {
  color: var(--l-muted);
}

.login-input:focus {
  border-color: var(--l-accent);
  transform: translateX(6px);
}

@media (prefers-reduced-motion: reduce) {
  .login-input { transition: none; }
  .login-input:focus { transform: none; }
}
</style>
