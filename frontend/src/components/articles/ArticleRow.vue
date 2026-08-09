<script setup lang="ts">
import type { Article } from "../../core/domain/article.js";
import ArticleStockBadge from "./ArticleStockBadge.vue";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ESin imagen%3C/text%3E%3C/svg%3E";

defineProps<{ article: Article }>();

function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.src = FALLBACK_IMAGE;
}
</script>

<template>
  <article class="cartoon-card flex flex-col overflow-hidden text-left">
    <img
      :src="article.imageUrl || FALLBACK_IMAGE"
      :alt="article.name"
      class="h-40 w-full border-b-4 border-slate-900 object-cover"
      @error="handleImageError"
    />
    <div class="flex flex-1 flex-col gap-2 p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-lg font-extrabold text-slate-900">{{ article.name }}</h3>
        <ArticleStockBadge :stock="article.stock" />
      </div>
      <p class="text-sm text-slate-600">{{ article.description }}</p>
      <span
        v-if="article.needsRepair"
        class="mt-1 inline-flex items-center rounded-full border-2 border-black bg-orange-200 px-2 py-0.5 text-xs font-bold text-orange-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <font-awesome-icon icon="wrench" class="mr-1" />
        Reparación
      </span>
    </div>
  </article>
</template>
