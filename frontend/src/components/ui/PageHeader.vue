<script setup lang="ts">
import Sprinkles from "./Sprinkles.vue";

defineProps<{
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
}>();
</script>

<template>
  <header class="relative mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
    <Sprinkles />
    <div class="relative max-w-2xl space-y-4">
      <router-link v-if="backTo" :to="backTo" class="ui-btn ui-btn-sm ui-btn-ghost">
        <span aria-hidden="true">&larr;</span> {{ backLabel ?? "Volver" }}
      </router-link>
      <h1 class="ui-sign text-5xl leading-[1] text-[var(--l-ink)] md:text-6xl">{{ title }}</h1>
      <p v-if="subtitle" class="max-w-[48ch] text-lg font-semibold leading-relaxed text-[var(--l-muted)]">
        {{ subtitle }}
      </p>
    </div>
    <div class="relative flex flex-wrap items-start gap-3 md:justify-end">
      <slot />
    </div>
  </header>
</template>
