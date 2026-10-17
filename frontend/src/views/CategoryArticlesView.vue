<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import type { Article } from "../core/domain/article.js";
import { getCategoryByIdUseCase } from "../core/usecases/getCategoryById.js";
import { listArticlesByCategoryUseCase } from "../core/usecases/listArticlesByCategory.js";
import ArticleRow from "../components/articles/ArticleRow.vue";
import ArticleActions from "../components/articles/ArticleActions.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import LocationStreetPanel from "../components/location/LocationStreetPanel.vue";

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
  <section class="mx-auto max-w-6xl px-4 py-12 md:px-8">
    <p v-if="isLoading" class="text-[var(--l-muted)]">El guardián está abriendo la puerta...</p>
    <p v-else-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

    <template v-else>
      <PageHeader
        :title="category?.name ?? 'Cuarto'"
        :subtitle="category?.description || 'Un cuarto sin descripción, por ahora.'"
        back-to="/categories"
        back-label="Todos los cuartos"
      >
        <router-link :to="`/categories/${categoryId}/edit`" class="ui-btn ui-btn-ghost">Arreglar el cuarto</router-link>
        <router-link :to="{ path: '/articles/new', query: { categoryId } }" class="ui-btn ui-btn-primary">
          Guardar algo aquí
        </router-link>
      </PageHeader>

      <LocationStreetPanel v-if="category?.location" class="mb-8" :location="category.location" eyebrow="Este cuarto queda en" />

      <p v-if="articles.length === 0" class="mb-8 max-w-[52ch] leading-relaxed text-[var(--l-muted)]">
        Este cuarto está vacío. Su guardián espera el primer artículo.
      </p>

      <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(article, index) in articles"
          :key="article.id"
          class="flex flex-col gap-3"
          :class="index % 3 === 1 ? 'lg:mt-8' : ''"
        >
          <button
            type="button"
            class="block rounded-[var(--l-radius)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--l-accent)]"
            @click="router.push(`/articles/${article.id}`)"
          >
            <ArticleRow :article="article" />
          </button>
          <ArticleActions :article="article" @deleted="handleArticleDeleted" />
        </div>

        <router-link :to="{ path: '/articles/new', query: { categoryId } }" class="ui-dashed-add">
          <span class="text-3xl font-semibold" aria-hidden="true">+</span>
          <span class="font-semibold text-[var(--l-ink)]">Guardar algo nuevo aquí</span>
        </router-link>
      </div>
    </template>
  </section>
</template>
