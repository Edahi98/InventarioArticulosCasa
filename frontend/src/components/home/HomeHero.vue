<script setup lang="ts">
import { useTheme } from "../../utils/useTheme.js";
import HomePark from "./HomePark.vue";

defineEmits<{ enter: [] }>();

const { isDark } = useTheme();
</script>

<template>
  <section class="relative isolate -mt-16 min-h-[100dvh] overflow-hidden">
    <HomePark :dark="isDark" class="absolute inset-0 z-0" />
    <div
      class="pointer-events-none absolute inset-0 z-[1] lg:[background:linear-gradient(90deg,color-mix(in_srgb,var(--l-bg)_92%,transparent)_0%,color-mix(in_srgb,var(--l-bg)_72%,transparent)_30%,transparent_58%)]"
      aria-hidden="true"
    />
    <div class="pointer-events-none relative z-[2] mx-auto grid min-h-[100dvh] max-w-7xl grid-cols-1 content-start gap-6 px-4 pb-16 pt-28 md:px-8 lg:grid-cols-12 lg:content-center lg:pt-24">
      <div class="pointer-events-auto space-y-7 lg:col-span-5">
        <h1 class="ui-sign text-5xl leading-[1] text-[var(--l-ink)] md:text-6xl">
          Un osito cuida cada cuarto de tu casa
        </h1>
        <p class="max-w-[40ch] text-lg font-semibold leading-relaxed text-[var(--l-muted)] md:text-xl">
          Anota lo que hay en cada cuarto y pregúntales cuando no encuentres algo.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button class="ui-btn ui-btn-primary" type="button" @click="$emit('enter')">Entrar al inventario</button>
          <a href="#guardianes" class="ui-btn ui-btn-ghost">Conocer a los guardianes</a>
        </div>
      </div>
    </div>
  </section>
</template>
