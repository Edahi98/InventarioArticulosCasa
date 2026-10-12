<script setup lang="ts">
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import HomeDollhouse from "./HomeDollhouse.vue";

defineProps<{ bears: InventoryBear[] }>();
defineEmits<{ enter: [] }>();
</script>

<template>
  <section class="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-7xl grid-cols-1 items-center gap-6 px-4 pb-10 pt-8 md:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-0">
    <div class="relative space-y-7 lg:col-span-5">
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

    <div class="h-[380px] sm:h-[460px] lg:col-span-7 lg:h-[640px]">
      <HomeDollhouse :bears="bears" label="Una casa de muñecas con cuatro cuartos y un osito en cada uno" />
    </div>
  </section>
</template>
