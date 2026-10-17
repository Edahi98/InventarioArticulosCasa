<script setup lang="ts">
import type { Category } from "../../core/domain/category.js";
import { HueSequence } from "../../infrastructure/three/neighborhood/HueSequence.js";

defineProps<{ categories: Category[]; counts: Record<number, number> }>();
const emit = defineEmits<{
  close: [];
  highlight: [id: number | null];
  edit: [category: Category];
  remove: [category: Category];
}>();
</script>

<template>
  <aside
    class="fixed bottom-24 right-3 top-24 z-10 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.6rem] bg-white/95 text-[#2a1730] shadow-[0_6px_0_var(--l-toy-edge)] md:right-8"
    aria-label="Lista de cuartos"
  >
    <div class="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
      <h2 class="text-xl" style="font-family: var(--l-display)">Tus cuartos</h2>
      <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost" aria-label="Cerrar la lista" @click="emit('close')">Cerrar</button>
    </div>

    <ul class="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
      <li
        v-for="category in categories"
        :key="category.id"
        class="rounded-2xl bg-[#fff4f8] px-3 py-2.5"
        @mouseenter="emit('highlight', category.id)"
        @mouseleave="emit('highlight', null)"
        @focusin="emit('highlight', category.id)"
        @focusout="emit('highlight', null)"
      >
        <div class="flex items-center gap-2">
          <span
            class="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-[#2a1730]/20"
            :style="{ backgroundColor: HueSequence.cssOf(category.id) }"
            aria-hidden="true"
          />
          <router-link :to="`/categories/${category.id}/articles`" class="min-w-0 flex-1 truncate font-extrabold hover:underline">
            {{ category.name }}
          </router-link>
          <span class="text-xs font-extrabold tabular-nums text-[#6b5470]">{{ counts[category.id] ?? 0 }}</span>
        </div>
        <p v-if="category.location" class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#6b5470]">
          <font-awesome-icon icon="location-dot" /> {{ category.location }}
        </p>
        <div class="mt-2 flex gap-2">
          <router-link :to="`/categories/${category.id}/articles`" class="ui-btn ui-btn-sm ui-btn-primary">Entrar</router-link>
          <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost" @click="emit('edit', category)">Arreglar</button>
          <button type="button" class="ui-btn ui-btn-sm ui-btn-danger" @click="emit('remove', category)">Demoler</button>
        </div>
      </li>
    </ul>

    <div class="border-t-2 border-[#f3dfe9] p-3">
      <router-link to="/categories/new" class="ui-btn ui-btn-sm ui-btn-primary w-full">Construir un cuarto nuevo</router-link>
    </div>
  </aside>
</template>
