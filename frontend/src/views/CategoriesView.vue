<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Category } from "../core/domain/category.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import CategoryCard from "../components/CategoryCard.vue";
import ExportButton from "../components/reports/ExportButton.vue";
import CategoryEditModal from "../components/categories/CategoryEditModal.vue";
import CategoryDeleteDialog from "../components/categories/CategoryDeleteDialog.vue";
import PageHeader from "../components/ui/PageHeader.vue";

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
  <section class="mx-auto max-w-6xl px-4 py-12 md:px-8">
    <PageHeader
      title="Los cuartos de tu casa"
      subtitle="Cada cuarto tiene su guardián. Entra a uno para ver todo lo que guarda."
    >
      <ExportButton />
      <router-link to="/articles/new" class="ui-btn ui-btn-primary">Guardar algo nuevo</router-link>
    </PageHeader>

    <p v-if="isLoading" class="text-[var(--l-muted)]">Los guardianes están abriendo las puertas...</p>
    <p v-else-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

    <div v-else class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(category, index) in categories"
        :key="category.id"
        class="flex flex-col gap-3"
        :class="index % 3 === 1 ? 'lg:mt-10' : ''"
      >
        <router-link
          :to="`/categories/${category.id}/articles`"
          class="block rounded-[var(--l-radius)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--l-accent)]"
        >
          <CategoryCard :category="category" />
        </router-link>
        <div class="flex gap-2">
          <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost" @click="editingCategory = category">
            Arreglar
          </button>
          <button type="button" class="ui-btn ui-btn-sm ui-btn-danger" @click="deletingCategory = category">
            Demoler
          </button>
        </div>
      </div>

      <router-link to="/categories/new" class="ui-dashed-add" :class="categories.length % 3 === 1 ? 'lg:mt-10' : ''">
        <span class="text-3xl font-semibold" aria-hidden="true">+</span>
        <span class="font-semibold text-[var(--l-ink)]">Construir un cuarto nuevo</span>
        <span class="text-sm">
          {{ categories.length === 0 ? "Tu casa todavía no tiene cuartos." : "Con su propio guardián." }}
        </span>
      </router-link>
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
