<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import { countArticlesByCategoryUseCase } from "../core/usecases/countArticlesByCategory.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import CategoryDeleteDialog from "../components/categories/CategoryDeleteDialog.vue";
import CategoryEditModal from "../components/categories/CategoryEditModal.vue";
import CategoryDrawer from "../components/map/CategoryDrawer.vue";
import NeighborhoodMap from "../components/map/NeighborhoodMap.vue";
import ExportButton from "../components/reports/ExportButton.vue";

const router = useRouter();

const categories = ref<Category[]>([]);
const counts = ref<Record<number, number>>({});
const isLoading = ref(true);
const errorMessage = ref("");
const listOpen = ref(false);
const map = ref<InstanceType<typeof NeighborhoodMap> | null>(null);

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
  editingCategory.value = null;
  deletingCategory.value = null;
}

onMounted(load);
</script>

<template>
  <section>
    <NeighborhoodMap v-if="!isLoading && !errorMessage" ref="map" :categories="categories" :counts="counts" @select="handleSelect">
      <template #actions>
        <ExportButton />
        <router-link to="/articles/new" class="ui-btn ui-btn-primary">Guardar algo nuevo</router-link>
      </template>
      <template #dock>
        <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" :aria-expanded="listOpen" @click="listOpen = !listOpen">
          <font-awesome-icon icon="folder-open" /> {{ listOpen ? "Ocultar lista" : "Lista de cuartos" }}
        </button>
      </template>
    </NeighborhoodMap>

    <div v-else class="fixed inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-[#b9a4f2] via-[#ffb3cb] to-[#ffe3ee] px-6">
      <p v-if="isLoading" class="rounded-[1.6rem] bg-white/90 px-6 py-4 font-semibold text-[#2a1730]">Los guardianes están dibujando la isla...</p>
      <p v-else role="alert" class="ui-error">{{ errorMessage }}</p>
    </div>

    <CategoryDrawer
      v-if="listOpen"
      :categories="categories"
      :counts="counts"
      @close="listOpen = false"
      @highlight="map?.highlight($event)"
      @edit="editingCategory = $event"
      @remove="deletingCategory = $event"
    />

    <CategoryEditModal v-if="editingCategory" :category="editingCategory" @close="editingCategory = null" @saved="handleCategorySaved" />
    <CategoryDeleteDialog v-if="deletingCategory" :category="deletingCategory" @close="deletingCategory = null" @deleted="handleCategoryDeleted" />
  </section>
</template>
