<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Category } from "../core/domain/category.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import CategoryCard from "../components/CategoryCard.vue";
import ExportButton from "../components/reports/ExportButton.vue";
import CategoryEditModal from "../components/categories/CategoryEditModal.vue";
import CategoryDeleteDialog from "../components/categories/CategoryDeleteDialog.vue";

const categories = ref<Category[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const editingCategory = ref<Category | null>(null);
const deletingCategory = ref<Category | null>(null);

async function loadCategories(): Promise<void> {
  isLoading.value = true;
  try {
    categories.value = await listCategoriesUseCase.execute();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Error al cargar las categorías.";
  } finally {
    isLoading.value = false;
  }
}

function handleCategorySaved(updated: Category): void {
  const index = categories.value.findIndex((category) => category.id === updated.id);
  if (index !== -1) {
    categories.value[index] = updated;
  }
  editingCategory.value = null;
}

function handleCategoryDeleted(id: number): void {
  categories.value = categories.value.filter((category) => category.id !== id);
  deletingCategory.value = null;
}

onMounted(loadCategories);
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Categorías</h1>
      <div class="flex gap-2">
        <ExportButton />
        <router-link to="/articles/new" class="cartoon-btn-secondary px-4 py-2 text-sm">
          + Artículo
        </router-link>
        <router-link to="/categories/new" class="cartoon-btn-primary px-4 py-2 text-sm">
          + Categoría
        </router-link>
      </div>
    </div>

    <p v-if="isLoading" class="text-gray-500">Cargando categorías...</p>
    <p v-else-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>
    <p v-else-if="categories.length === 0" class="text-gray-500">
      No hay categorías registradas todavía.
    </p>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <div v-for="category in categories" :key="category.id" class="relative">
        <router-link :to="`/categories/${category.id}/articles`" class="block">
          <CategoryCard :category="category" />
        </router-link>

        <div class="absolute right-2 top-2 flex gap-1">
          <button
            class="rounded-md border border-slate-900 bg-white px-2 py-1 text-xs font-semibold text-slate-900 shadow-sm hover:bg-gray-50"
            @click.stop.prevent="editingCategory = category"
          >
            Editar
          </button>
          <button
            class="rounded-md border border-rose-400 bg-white px-2 py-1 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
            @click.stop.prevent="deletingCategory = category"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <CategoryEditModal
      v-if="editingCategory"
      :category="editingCategory"
      @close="editingCategory = null"
      @saved="handleCategorySaved"
    />

    <CategoryDeleteDialog
      v-if="deletingCategory"
      :category="deletingCategory"
      @close="deletingCategory = null"
      @deleted="handleCategoryDeleted"
    />
  </section>
</template>
