<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <section class="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
    <div class="cartoon-panel p-8">
      <p class="text-5xl"><font-awesome-icon icon="magnifying-glass" /></p>
      <h1 class="mt-2 text-2xl font-extrabold text-slate-900">Página no encontrada</h1>
      <p class="mt-2 text-slate-700">No existe nada en esta dirección.</p>
      <button class="cartoon-btn-primary mt-4" @click="router.push('/')">Volver al inicio</button>
    </div>
  </section>
</template>
