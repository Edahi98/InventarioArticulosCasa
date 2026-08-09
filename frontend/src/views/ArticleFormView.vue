<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import { createArticleUseCase } from "../core/usecases/createArticle.js";
import { updateArticleUseCase } from "../core/usecases/updateArticle.js";
import { getArticleByIdUseCase } from "../core/usecases/getArticleById.js";
import ImageUploader from "../components/ImageUploader.vue";

const router = useRouter();
const route = useRoute();

const articleId = route.params.id ? Number(route.params.id) : null;
const isEditMode = computed(() => articleId !== null);

const categories = ref<Category[]>([]);
const form = reactive({
  name: "",
  description: "",
  imageUrl: "",
  categoryId: Number(route.query.categoryId) || 0,
  stock: 0,
  needsRepair: false,
});

const isLoading = ref(isEditMode.value);
const isSubmitting = ref(false);
const isImageUploading = ref(false);
const errorMessage = ref("");

onMounted(async () => {
  categories.value = await listCategoriesUseCase.execute();

  if (!articleId) return;
  try {
    const article = await getArticleByIdUseCase.execute(articleId);
    form.name = article.name;
    form.description = article.description;
    form.imageUrl = article.imageUrl;
    form.categoryId = article.categoryId;
    form.stock = article.stock;
    form.needsRepair = article.needsRepair;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo cargar el artículo.";
  } finally {
    isLoading.value = false;
  }
});

function handleImageUploaded(url: string): void {
  form.imageUrl = url;
}

function handleImageUploadingChange(uploading: boolean): void {
  isImageUploading.value = uploading;
}

async function handleSubmit(): Promise<void> {
  errorMessage.value = "";

  if (isImageUploading.value) {
    errorMessage.value = "Espera a que la imagen termine de subir.";
    return;
  }
  if (!form.imageUrl) {
    errorMessage.value = "Debes subir una imagen antes de guardar el artículo.";
    return;
  }
  if (!form.categoryId) {
    errorMessage.value = "Debes seleccionar una categoría.";
    return;
  }
  if (!Number.isInteger(form.stock) || form.stock < 0) {
    errorMessage.value = "El stock debe ser un número entero no negativo.";
    return;
  }

  isSubmitting.value = true;
  try {
    const input = {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
      categoryId: form.categoryId,
      stock: form.stock,
      needsRepair: form.needsRepair,
    };

    if (articleId) {
      await updateArticleUseCase.execute(articleId, input);
      router.push(`/articles/${articleId}`);
    } else {
      await createArticleUseCase.execute(input);
      router.push(`/categories/${form.categoryId}/articles`);
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo guardar el artículo.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="mb-6 text-2xl font-extrabold text-slate-900">
      {{ isEditMode ? "Editar artículo" : "Nuevo artículo" }}
    </h1>

    <p v-if="isLoading" class="text-slate-500">Cargando artículo...</p>

    <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-bold text-slate-800" for="name">Nombre</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="cartoon-input"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-bold text-slate-800" for="description">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="cartoon-input"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-bold text-slate-800" for="categoryId">Categoría</label>
        <select
          id="categoryId"
          v-model.number="form.categoryId"
          required
          class="cartoon-input"
        >
          <option value="0" disabled>Selecciona una categoría</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-bold text-slate-800" for="stock">Stock</label>
        <input
          id="stock"
          v-model.number="form.stock"
          type="number"
          min="0"
          step="1"
          class="cartoon-input"
        />
      </div>

      <label class="flex cursor-pointer items-center gap-3">
        <input
          v-model="form.needsRepair"
          type="checkbox"
          class="h-5 w-5 rounded border-2 border-slate-900 accent-rose-500"
        />
        <span class="font-bold text-slate-800">Necesita reparación</span>
      </label>

      <ImageUploader
        :initial-image-url="form.imageUrl"
        @uploaded="handleImageUploaded"
        @uploading="handleImageUploadingChange"
      />

      <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

      <button
        type="submit"
        :disabled="isSubmitting || isImageUploading"
        class="cartoon-btn-primary disabled:opacity-50"
      >
        {{
          isImageUploading
            ? "Subiendo imagen..."
            : isSubmitting
              ? "Guardando..."
              : isEditMode
                ? "Guardar cambios"
                : "Guardar artículo"
        }}
      </button>
    </form>
  </section>
</template>
