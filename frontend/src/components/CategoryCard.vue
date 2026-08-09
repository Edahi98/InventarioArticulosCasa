<script setup lang="ts">
import type { Category } from "../core/domain/category.js";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3ESin imagen%3C/text%3E%3C/svg%3E";

defineProps<{ category: Category }>();

function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.src = FALLBACK_IMAGE;
}
</script>

<template>
  <article
    class="cartoon-card flex flex-col overflow-hidden"
  >
    <img
      :src="category.imageUrl || FALLBACK_IMAGE"
      :alt="category.name"
      class="h-40 w-full object-cover border-b-4 border-slate-900"
      @error="handleImageError"
    />
    <div class="flex flex-1 flex-col gap-1 p-4">
      <h3 class="text-lg font-extrabold text-slate-900">{{ category.name }}</h3>
      <p class="text-sm text-slate-600">{{ category.description }}</p>
    </div>
  </article>
</template>
