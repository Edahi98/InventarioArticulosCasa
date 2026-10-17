<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import type { Article } from "../core/domain/article.js";
import { getCategoryByIdUseCase } from "../core/usecases/getCategoryById.js";
import { listArticlesByCategoryUseCase } from "../core/usecases/listArticlesByCategory.js";
import ArticleRow from "../components/articles/ArticleRow.vue";
import ArticleActions from "../components/articles/ArticleActions.vue";
import ItemFigure from "../components/articles/ItemFigure.vue";
import LocationStreetPanel from "../components/location/LocationStreetPanel.vue";
import MenuBackdrop from "../components/ui/MenuBackdrop.vue";

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
  <section class="isolate mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <MenuBackdrop scene="puerto" class="pointer-events-none fixed inset-0 -z-10" />
    <p v-if="isLoading" class="text-[var(--l-muted)]">El guardián está abriendo la puerta...</p>
    <p v-else-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

    <template v-else>
      <router-link to="/categories" class="ui-btn ui-btn-sm ui-btn-ghost mb-14">
        <span aria-hidden="true">&larr;</span> Todos los cuartos
      </router-link>

      <div class="menu-panel">
        <header class="menu-title">
          <h1 class="ui-sign text-4xl leading-none md:text-5xl">{{ category?.name ?? "Cuarto" }}</h1>
        </header>
        <p class="menu-label text-center">Inventario del cuarto</p>
        <p class="mx-auto mt-2 max-w-[52ch] text-center font-semibold text-[var(--l-muted)]">
          {{ category?.description || "Un cuarto sin descripción, por ahora." }}
        </p>
        <div class="mt-5 flex flex-wrap justify-center gap-3">
          <router-link :to="`/categories/${categoryId}/edit`" class="ui-btn ui-btn-sm ui-btn-ghost">Arreglar el cuarto</router-link>
          <router-link :to="{ path: '/articles/new', query: { categoryId } }" class="ui-btn ui-btn-sm ui-btn-primary">
            Guardar algo aquí
          </router-link>
        </div>

        <LocationStreetPanel v-if="category?.location" class="mt-6" :location="category.location" eyebrow="Este cuarto queda en" />

        <div v-if="articles.length === 0" class="mx-auto mt-6 flex max-w-xs flex-col items-center text-center">
          <div class="h-40 w-48"><ItemFigure :name="category?.name ?? 'cuarto'" /></div>
          <p class="font-semibold leading-relaxed text-[var(--l-muted)]">
            Este cuarto está vacío. Su guardián espera el primer artículo.
          </p>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="article in articles" :key="article.id" class="flex flex-col gap-3">
            <button
              type="button"
              class="block rounded-[26px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--l-accent)]"
              @click="router.push(`/articles/${article.id}`)"
            >
              <ArticleRow :article="article" />
            </button>
            <ArticleActions :article="article" @deleted="handleArticleDeleted" />
          </div>

          <router-link :to="{ path: '/articles/new', query: { categoryId } }" class="ui-dashed-add !rounded-[26px]">
            <span class="text-3xl font-semibold" aria-hidden="true">+</span>
            <span class="font-semibold text-[var(--l-ink)]">Guardar algo nuevo aquí</span>
          </router-link>
        </div>
      </div>
    </template>
  </section>
</template>
