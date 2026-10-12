<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import { createArticleUseCase } from "../core/usecases/createArticle.js";
import { updateArticleUseCase } from "../core/usecases/updateArticle.js";
import { getArticleByIdUseCase } from "../core/usecases/getArticleById.js";
import ArticleRow from "../components/articles/ArticleRow.vue";
import ImageUploader from "../components/ImageUploader.vue";
import FormField from "../components/ui/FormField.vue";
import PageHeader from "../components/ui/PageHeader.vue";

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

const preview = computed(() => ({
  name: form.name || "El nombre del artículo",
  description: form.description || "Aquí irá su descripción.",
  imageUrl: form.imageUrl,
  stock: form.stock,
  needsRepair: form.needsRepair,
}));

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
    errorMessage.value = "Espera a que la foto termine de subir.";
    return;
  }
  if (!form.imageUrl) {
    errorMessage.value = "Sube una foto del artículo antes de guardarlo.";
    return;
  }
  if (!form.categoryId) {
    errorMessage.value = "Elige en qué cuarto se guarda.";
    return;
  }
  if (!Number.isInteger(form.stock) || form.stock < 0) {
    errorMessage.value = "La cantidad debe ser un número entero, de cero para arriba.";
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
  <section class="mx-auto max-w-5xl px-4 py-12 md:px-8">
    <PageHeader
      :title="isEditMode ? 'Cambiar algo de este artículo' : 'Guardar algo nuevo'"
      subtitle="Cuéntale al guardián qué es, cuántos hay y en qué cuarto vive."
      back-to="/categories"
      back-label="Todos los cuartos"
    />

    <p v-if="isLoading" class="text-[var(--l-muted)]">Sacando el artículo de su estante...</p>

    <div v-else class="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <form
        class="ui-notebook flex flex-col gap-6 py-8 pr-6 sm:pr-8 lg:col-span-7"
        @submit.prevent="handleSubmit"
      >
        <FormField label="Nombre" for-id="name">
          <input id="name" v-model="form.name" type="text" required class="ui-input" placeholder="Taladro, licuadora..." />
        </FormField>

        <FormField label="Descripción" for-id="description">
          <textarea id="description" v-model="form.description" rows="3" class="ui-input" placeholder="Marca, color, dónde lo compraste..." />
        </FormField>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="Cuarto" for-id="categoryId">
            <select id="categoryId" v-model.number="form.categoryId" required class="ui-input">
              <option value="0" disabled>Elige un cuarto</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </FormField>

          <FormField label="Cuántos hay" for-id="stock">
            <input id="stock" v-model.number="form.stock" type="number" min="0" step="1" class="ui-input" />
          </FormField>
        </div>

        <label class="flex cursor-pointer items-center gap-3 rounded-[var(--l-radius)] bg-[var(--l-bg)] p-4">
          <input v-model="form.needsRepair" type="checkbox" class="h-5 w-5 accent-[var(--l-accent)]" />
          <span class="font-semibold">Está roto o necesita una reparación</span>
        </label>

        <ImageUploader
          :initial-image-url="form.imageUrl"
          @uploaded="handleImageUploaded"
          @uploading="handleImageUploadingChange"
        />

        <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

        <button type="submit" :disabled="isSubmitting || isImageUploading" class="ui-btn ui-btn-primary">
          {{
            isImageUploading
              ? "Subiendo la foto..."
              : isSubmitting
                ? "Guardando..."
                : isEditMode
                  ? "Guardar cambios"
                  : "Guardarlo en su cuarto"
          }}
        </button>
      </form>

      <aside class="lg:col-span-5">
        <p class="mb-4 text-sm font-semibold text-[var(--l-muted)]">Así se verá en la casa</p>
        <div class="mx-auto max-w-xs -rotate-2 lg:sticky lg:top-24">
          <ArticleRow :article="preview" />
        </div>
      </aside>
    </div>
  </section>
</template>
