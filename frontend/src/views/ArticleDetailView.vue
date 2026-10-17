<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Article } from "../core/domain/article.js";
import { getArticleByIdUseCase } from "../core/usecases/getArticleById.js";
import ItemFigure from "../components/articles/ItemFigure.vue";
import NoteList from "../components/NoteList.vue";
import ArticleStockBadge from "../components/articles/ArticleStockBadge.vue";
import ArticleActions from "../components/articles/ArticleActions.vue";
import LocationStreetPanel from "../components/location/LocationStreetPanel.vue";
import MenuBackdrop from "../components/ui/MenuBackdrop.vue";

const route = useRoute();
const router = useRouter();
const articleId = Number(route.params.id);

const article = ref<Article | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");
const photoBroken = ref(false);

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
  <section class="isolate mx-auto max-w-5xl px-4 pb-12 pt-6 md:px-8">
    <MenuBackdrop scene="almacen" class="pointer-events-none fixed inset-0 -z-10" />
    <p v-if="isLoading" class="text-[var(--l-muted)]">Buscando el artículo en la casa...</p>
    <p v-else-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

    <template v-else-if="article">
      <router-link
        :to="`/categories/${article.categoryId}/articles`"
        class="ui-btn ui-btn-sm ui-btn-ghost mb-14"
      >
        <span aria-hidden="true">&larr;</span> Volver al cuarto
      </router-link>

      <div class="menu-panel mb-10">
        <header class="menu-title">
          <h1 class="ui-sign text-3xl leading-none sm:text-4xl md:text-5xl">{{ article.name }}</h1>
        </header>

        <div class="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
          <div class="md:col-span-5">
            <div class="showcase">
              <img
                v-if="article.imageUrl && !photoBroken"
                :src="article.imageUrl"
                :alt="article.name"
                class="h-full w-full object-cover"
                @error="photoBroken = true"
              />
              <ItemFigure v-else :name="article.name" />
            </div>
          </div>

          <div class="space-y-4 md:col-span-7">
            <p class="menu-label">Ficha del objeto</p>
            <p class="text-lg font-semibold leading-relaxed text-[var(--l-muted)]">
              {{ article.description || "Nadie le escribió una descripción todavía." }}
            </p>

            <ul class="grid gap-3">
              <li class="menu-slot">
                <span class="menu-badge menu-badge-sun" aria-hidden="true"><font-awesome-icon icon="box" /></span>
                <div>
                  <p class="menu-label">Cantidad</p>
                  <ArticleStockBadge :stock="article.stock" />
                </div>
              </li>
              <li class="menu-slot">
                <span class="menu-badge" :class="article.needsRepair ? 'menu-badge-rose' : 'menu-badge-lilac'" aria-hidden="true">
                  <font-awesome-icon icon="wrench" />
                </span>
                <div>
                  <p class="menu-label">Estado</p>
                  <p class="font-extrabold">{{ article.needsRepair ? "Por reparar" : "En buen estado" }}</p>
                </div>
              </li>
              <li v-if="article.location" class="menu-slot">
                <span class="menu-badge menu-badge-rose" aria-hidden="true"><font-awesome-icon icon="location-dot" /></span>
                <div class="min-w-0">
                  <p class="menu-label">Se guarda en</p>
                  <p class="truncate font-extrabold">{{ article.location }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <LocationStreetPanel v-if="article.location" class="mt-8" :location="article.location" eyebrow="Se guarda en" />

        <div class="mt-6 flex justify-center">
          <ArticleActions :article="article" @deleted="handleArticleDeleted" />
        </div>
      </div>

      <div class="menu-panel !pt-6">
        <NoteList :article-id="article.id" />
      </div>
    </template>
  </section>
</template>
