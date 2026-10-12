<script setup lang="ts">
import type { Article } from "../../core/domain/article.js";
import { FALLBACK_IMAGE, handleImageError } from "../../utils/fallbackImage.js";
import ArticleStockBadge from "./ArticleStockBadge.vue";

defineProps<{
  article: Pick<Article, "name" | "description" | "imageUrl" | "stock" | "needsRepair">;
}>();
</script>

<template>
  <article
    class="ui-toy flex h-full flex-col overflow-hidden bg-[var(--l-surface)] text-left transition-transform duration-200 hover:-translate-y-1 hover:rotate-[0.6deg]"
  >
    <div class="aspect-[4/3] overflow-hidden bg-[var(--l-surface-2)]">
      <img
        :src="article.imageUrl || FALLBACK_IMAGE"
        :alt="article.name"
        class="h-full w-full object-cover"
        @error="handleImageError"
      />
    </div>
    <div class="flex flex-1 flex-col gap-3 p-5">
      <h3 class="text-lg font-semibold leading-snug tracking-tight">{{ article.name }}</h3>
      <p class="line-clamp-2 text-sm leading-relaxed text-[var(--l-muted)]">
        {{ article.description || "Sin descripción" }}
      </p>
      <div class="mt-auto flex flex-wrap gap-2">
        <ArticleStockBadge :stock="article.stock" />
        <span v-if="article.needsRepair" class="ui-chip ui-chip-sun">
          <font-awesome-icon icon="wrench" /> Para reparar
        </span>
      </div>
    </div>
  </article>
</template>
