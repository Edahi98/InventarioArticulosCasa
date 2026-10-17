<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import { countArticlesByCategoryUseCase } from "../core/usecases/countArticlesByCategory.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import NeighborhoodMap from "../components/map/NeighborhoodMap.vue";
import PageHeader from "../components/ui/PageHeader.vue";

const router = useRouter();

const categories = ref<Category[]>([]);
const counts = ref<Record<number, number>>({});
const isLoading = ref(true);
const errorMessage = ref("");

function handleSelect(id: number): void {
  router.push(`/categories/${id}/articles`);
}

onMounted(async () => {
  try {
    const [list, report] = await Promise.all([listCategoriesUseCase.execute(), countArticlesByCategoryUseCase.execute()]);
    categories.value = list;
    counts.value = Object.fromEntries(report.categories.map((entry) => [entry.categoryId, entry.total]));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "No se pudo cargar el barrio.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-12 md:px-8">
    <PageHeader
      title="El barrio de tus cosas"
      subtitle="Cada cuarto es una casa con su color. Más artículos, más flores y más humo; de noche se encienden las luces."
    >
      <router-link to="/categories/new" class="ui-btn ui-btn-primary">Construir un cuarto</router-link>
    </PageHeader>

    <p v-if="isLoading" class="text-[var(--l-muted)]">Los guardianes están dibujando el mapa...</p>
    <p v-else-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
    <NeighborhoodMap v-else :categories="categories" :counts="counts" @select="handleSelect" />
  </section>
</template>
