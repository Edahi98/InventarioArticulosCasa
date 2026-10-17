<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import { countArticlesByCategoryUseCase } from "../core/usecases/countArticlesByCategory.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import CategoryDeleteDialog from "../components/categories/CategoryDeleteDialog.vue";
import CategoryEditModal from "../components/categories/CategoryEditModal.vue";
import NeighborhoodMap from "../components/map/NeighborhoodMap.vue";
import ExportButton from "../components/reports/ExportButton.vue";

const router = useRouter();

const categories = ref<Category[]>([]);
const counts = ref<Record<number, number>>({});
const isLoading = ref(true);
const errorMessage = ref("");

const editingCategory = ref<Category | null>(null);
const deletingCategory = ref<Category | null>(null);

async function load(): Promise<void> {
  try {
    const [list, report] = await Promise.all([listCategoriesUseCase.execute(), countArticlesByCategoryUseCase.execute()]);
    categories.value = list;
    counts.value = Object.fromEntries(report.categories.map((entry) => [entry.categoryId, entry.total]));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Error al cargar las categorías.";
  } finally {
    isLoading.value = false;
  }
}

function handleSelect(id: number): void {
  router.push(`/categories/${id}/articles`);
}

function handleCategorySaved(updated: Category): void {
  const index = categories.value.findIndex((category) => category.id === updated.id);
  if (index !== -1) categories.value[index] = updated;
  editingCategory.value = null;
}

function handleCategoryDeleted(id: number): void {
  categories.value = categories.value.filter((category) => category.id !== id);
  deletingCategory.value = null;
}

onMounted(load);
</script>

<template>
  <section>
    <NeighborhoodMap
      v-if="!isLoading && !errorMessage"
      :key="categories.length"
      :categories="categories"
      :counts="counts"
      @select="handleSelect"
      @edit="editingCategory = $event"
      @remove="deletingCategory = $event"
    >
      <template #actions>
        <ExportButton />
        <router-link to="/articles/new" class="ui-btn ui-btn-primary" aria-label="Guardar algo nuevo">
          <font-awesome-icon icon="plus" /> <span class="hidden sm:inline">Guardar algo nuevo</span>
        </router-link>
      </template>
    </NeighborhoodMap>

    <div v-else class="fixed inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3d6] px-6">
      <p v-if="isLoading" class="rounded-[1.6rem] bg-white/90 px-6 py-4 font-semibold text-[#2a1730]">Los guardianes están dibujando la isla...</p>
      <p v-else role="alert" class="ui-error">{{ errorMessage }}</p>
    </div>

    <CategoryEditModal v-if="editingCategory" :category="editingCategory" @close="editingCategory = null" @saved="handleCategorySaved" />
    <CategoryDeleteDialog v-if="deletingCategory" :category="deletingCategory" @close="deletingCategory = null" @deleted="handleCategoryDeleted" />
  </section>
</template>
