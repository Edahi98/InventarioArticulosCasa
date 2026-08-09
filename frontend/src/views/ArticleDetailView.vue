<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Article } from "../core/domain/article.js";
import { getArticleByIdUseCase } from "../core/usecases/getArticleById.js";
import NoteList from "../components/NoteList.vue";
import ArticleStockBadge from "../components/articles/ArticleStockBadge.vue";
import ArticleActions from "../components/articles/ArticleActions.vue";

const route = useRoute();
const router = useRouter();
const articleId = Number(route.params.id);

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ESin imagen%3C/text%3E%3C/svg%3E";

const article = ref<Article | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");

function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.src = FALLBACK_IMAGE;
}

function handleArticleDeleted(): void {
  if (article.value) {
    router.push(`/categories/${article.value.categoryId}/articles`);
  }
}

onMounted(async () => {
  try {
    article.value = await getArticleByIdUseCase.execute(articleId);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Error al cargar el artículo.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-8">
    <p v-if="isLoading" class="text-gray-500">Cargando artículo...</p>
    <p v-else-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>

    <template v-else-if="article">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row">
        <img
          :src="article.imageUrl || FALLBACK_IMAGE"
          :alt="article.name"
          class="h-48 w-48 rounded-md object-cover"
          @error="handleImageError"
        />
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-bold text-gray-900">{{ article.name }}</h1>
            <ArticleStockBadge :stock="article.stock" />
            <span
              v-if="article.needsRepair"
              class="inline-flex items-center rounded-full border-2 border-black bg-orange-200 px-3 py-1 text-xs font-bold text-orange-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <font-awesome-icon icon="wrench" class="mr-1" />
              Necesita reparación
            </span>
          </div>
          <p class="text-gray-600">{{ article.description }}</p>
          <div class="mt-1">
            <ArticleActions :article="article" @deleted="handleArticleDeleted" />
          </div>
        </div>
      </div>

      <NoteList :article-id="article.id" />
    </template>
  </section>
</template>
