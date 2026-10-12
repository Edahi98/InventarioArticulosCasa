<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Article } from "../core/domain/article.js";
import { getArticleByIdUseCase } from "../core/usecases/getArticleById.js";
import { FALLBACK_IMAGE, handleImageError } from "../utils/fallbackImage.js";
import NoteList from "../components/NoteList.vue";
import ArticleStockBadge from "../components/articles/ArticleStockBadge.vue";
import ArticleActions from "../components/articles/ArticleActions.vue";

const route = useRoute();
const router = useRouter();
const articleId = Number(route.params.id);

const article = ref<Article | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");

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
  <section class="mx-auto max-w-5xl px-4 py-12 md:px-8">
    <p v-if="isLoading" class="text-[var(--l-muted)]">Buscando el artículo en la casa...</p>
    <p v-else-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

    <template v-else-if="article">
      <router-link
        :to="`/categories/${article.categoryId}/articles`"
        class="ui-btn ui-btn-sm ui-btn-ghost mb-10"
      >
        <span aria-hidden="true">&larr;</span> Volver al cuarto
      </router-link>

      <div class="mb-16 grid grid-cols-1 items-start gap-10 md:grid-cols-12">
        <figure class="ui-polaroid mx-auto w-full max-w-sm -rotate-2 md:col-span-5">
          <img
            :src="article.imageUrl || FALLBACK_IMAGE"
            :alt="article.name"
            class="aspect-square w-full rounded-[3px] object-cover"
            @error="handleImageError"
          />
          <figcaption class="px-1 pt-3 text-center text-sm font-semibold">{{ article.name }}</figcaption>
        </figure>

        <div class="space-y-5 md:col-span-7 md:pt-4">
          <h1 class="ui-sign text-5xl leading-[1.02] md:text-6xl">{{ article.name }}</h1>
          <div class="flex flex-wrap gap-2">
            <ArticleStockBadge :stock="article.stock" />
            <span
              v-if="article.needsRepair"
              class="inline-flex rotate-3 items-center gap-2 rounded-xl border-4 border-double border-[var(--l-danger)] px-3 py-1 text-xs font-extrabold uppercase text-[var(--l-danger)]"
            >
              <font-awesome-icon icon="wrench" /> Por reparar
            </span>
          </div>
          <p class="max-w-[52ch] text-lg leading-relaxed text-[var(--l-muted)]">
            {{ article.description || "Nadie le escribió una descripción todavía." }}
          </p>
          <ArticleActions :article="article" @deleted="handleArticleDeleted" />
        </div>
      </div>

      <NoteList :article-id="article.id" />
    </template>
  </section>
</template>
