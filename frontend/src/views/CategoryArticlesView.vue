<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import type { Article } from "../core/domain/article.js";
import { getCategoryByIdUseCase } from "../core/usecases/getCategoryById.js";
import { listArticlesByCategoryUseCase } from "../core/usecases/listArticlesByCategory.js";
import ArticleRow from "../components/articles/ArticleRow.vue";
import ArticleActions from "../components/articles/ArticleActions.vue";

const route = useRoute();
const router = useRouter();
const categoryId = Number(route.params.id);

const category = ref<Category | null>(null);
const articles = ref<Article[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

onMounted(async () => {
  try {
    const [categoryResult, articlesResult] = await Promise.all([
      getCategoryByIdUseCase.execute(categoryId),
      listArticlesByCategoryUseCase.execute(categoryId),
    ]);
    category.value = categoryResult;
    articles.value = articlesResult;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Error al cargar la categoría.";
  } finally {
    isLoading.value = false;
  }
});

function handleArticleDeleted(id: number): void {
  articles.value = articles.value.filter((article) => article.id !== id);
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-8">
    <p v-if="isLoading" class="text-gray-500">Cargando artículos...</p>
    <p v-else-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>

    <template v-else>
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          Artículos en "{{ category?.name }}"
        </h1>
        <div class="flex gap-2">
          <router-link :to="`/categories/${categoryId}/edit`" class="cartoon-btn-secondary px-4 py-2 text-sm">
            Editar categoría
          </router-link>
          <router-link :to="{ path: '/articles/new', query: { categoryId } }" class="cartoon-btn-primary px-4 py-2 text-sm">
            + Artículo
          </router-link>
        </div>
      </div>

      <p v-if="articles.length === 0" class="text-gray-500">
        Esta categoría todavía no tiene artículos.
      </p>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div v-for="article in articles" :key="article.id" class="flex flex-col gap-2">
          <button class="text-left" @click="router.push(`/articles/${article.id}`)">
            <ArticleRow :article="article" />
          </button>
          <ArticleActions :article="article" @deleted="handleArticleDeleted" />
        </div>
      </div>
    </template>
  </section>
</template>
