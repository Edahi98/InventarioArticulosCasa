<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

const router = useRouter();
const route = useRoute();

const form = reactive({
  username: "",
  password: "",
});

const isSubmitting = ref(false);
const errorMessage = ref("");

async function handleSubmit(): Promise<void> {
  errorMessage.value = "";
  isSubmitting.value = true;
  try {
    await authenticatedHttpClient.login(form.username, form.password);
    const redirectTo = (route.query.redirect as string) || "/categories";
    router.push(redirectTo);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo iniciar sesión.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-8">
    <div class="cartoon-panel w-full p-8">
      <h1 class="mb-1 text-3xl font-extrabold text-slate-900">
        ¡Hola de nuevo! <font-awesome-icon icon="hand" />
      </h1>
      <p class="mb-6 text-slate-700">Inicia sesión para entrar a tu inventario.</p>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-slate-800" for="username">Usuario</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            class="cartoon-input"
            placeholder="tu usuario"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-slate-800" for="password">Contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="cartoon-input"
            placeholder="••••••••"
          />
        </div>

        <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

        <button type="submit" :disabled="isSubmitting" class="cartoon-btn-primary mt-2 disabled:opacity-50">
          {{ isSubmitting ? "Entrando..." : "Entrar" }}
        </button>
      </form>
    </div>
  </section>
</template>
