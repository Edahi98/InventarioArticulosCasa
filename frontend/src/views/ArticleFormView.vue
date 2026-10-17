<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Category } from "../core/domain/category.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";
import { createArticleUseCase } from "../core/usecases/createArticle.js";
import { updateArticleUseCase } from "../core/usecases/updateArticle.js";
import { getArticleByIdUseCase } from "../core/usecases/getArticleById.js";
import { uploadArticleImageUseCase } from "../core/usecases/uploadArticleImage.js";
import { articleForm } from "../validators/articleValidators.js";
import { validateInput } from "../validators/validateInput.js";
import ArticleRow from "../components/articles/ArticleRow.vue";
import ImageUploader from "../components/ImageUploader.vue";
import FormField from "../components/ui/FormField.vue";
import MenuBackdrop from "../components/ui/MenuBackdrop.vue";

const router = useRouter();
const route = useRoute();

const articleId = route.params.id ? Number(route.params.id) : null;
const isEditMode = computed(() => articleId !== null);

const categories = ref<Category[]>([]);
const form = reactive({
  name: "",
  description: "",
  location: "",
  imageUrl: "",
  categoryId: Number(route.query.categoryId) || 0,
  stock: 0,
  needsRepair: false,
});

const pendingFile = ref<File | null>(null);
const pendingPreview = ref("");

const isLoading = ref(isEditMode.value);
const isSubmitting = ref(false);
const isUploading = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string>>({});

const preview = computed(() => ({
  name: form.name || "El nombre del artículo",
  description: form.description || "Aquí irá su descripción.",
  imageUrl: pendingPreview.value || form.imageUrl,
  stock: form.stock,
  needsRepair: form.needsRepair,
  location: form.location,
}));

onMounted(async () => {
  categories.value = await listCategoriesUseCase.execute();

  if (!articleId) return;
  try {
    const article = await getArticleByIdUseCase.execute(articleId);
    form.name = article.name;
    form.description = article.description;
    form.location = article.location;
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

function handleImageSelected(file: File, previewUrl: string): void {
  pendingFile.value = file;
  pendingPreview.value = previewUrl;
}

async function resolveImageUrl(): Promise<string> {
  if (!pendingFile.value) return form.imageUrl;
  isUploading.value = true;
  try {
    const uploaded = await uploadArticleImageUseCase.execute(pendingFile.value);
    return uploaded.url;
  } finally {
    isUploading.value = false;
  }
}

async function handleSubmit(): Promise<void> {
  errorMessage.value = "";
  fieldErrors.value = {};

  const checked = validateInput(articleForm, {
    name: form.name,
    description: form.description,
    location: form.location,
    categoryId: form.categoryId,
    stock: form.stock,
    needsRepair: form.needsRepair,
  });
  if (!checked.ok) {
    fieldErrors.value = checked.failure.fields;
    errorMessage.value = checked.failure.message;
    return;
  }
  if (!form.imageUrl && !pendingFile.value) {
    errorMessage.value = "Elige una foto del artículo antes de guardarlo.";
    return;
  }

  isSubmitting.value = true;
  try {
    const input = { ...checked.data, imageUrl: await resolveImageUrl() };

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
  <section class="isolate mx-auto max-w-5xl px-4 pb-12 pt-6 md:px-8">
    <MenuBackdrop scene="correo" class="pointer-events-none fixed inset-0 -z-10" />
    <router-link to="/categories" class="ui-btn ui-btn-sm ui-btn-ghost mb-14">
      <span aria-hidden="true">&larr;</span> Todos los cuartos
    </router-link>

    <p v-if="isLoading" class="text-[var(--l-muted)]">Sacando el artículo de su estante...</p>

    <div v-else class="menu-panel">
      <header class="menu-title">
        <h1 class="ui-sign text-3xl leading-none sm:text-4xl md:text-5xl">
          {{ isEditMode ? "Cambiar algo" : "Guardar algo nuevo" }}
        </h1>
      </header>
      <p class="menu-label text-center">Nuevo objeto</p>
      <p class="mb-8 mt-2 text-center font-semibold text-[var(--l-muted)]">
        Cuéntale al guardián qué es, cuántos hay y en qué cuarto vive.
      </p>

    <div class="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <form
        class="flex flex-col gap-6 lg:col-span-7"
        @submit.prevent="handleSubmit"
      >
        <FormField label="Nombre" for-id="name" :error="fieldErrors.name">
          <input id="name" v-model="form.name" type="text" required class="ui-input" placeholder="Taladro, licuadora..." />
        </FormField>

        <FormField label="Descripción" for-id="description" :error="fieldErrors.description">
          <textarea id="description" v-model="form.description" rows="3" class="ui-input" placeholder="Marca, color, dónde lo compraste..." />
        </FormField>

        <FormField label="Ubicación" for-id="location" :error="fieldErrors.location">
          <input id="location" v-model="form.location" type="text" class="ui-input" placeholder="Estante de arriba, cajón de la cocina..." />
        </FormField>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="Cuarto" for-id="categoryId" :error="fieldErrors.categoryId">
            <select id="categoryId" v-model.number="form.categoryId" required class="ui-input">
              <option value="0" disabled>Elige un cuarto</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </FormField>

          <FormField label="Cuántos hay" for-id="stock" :error="fieldErrors.stock">
            <input id="stock" v-model.number="form.stock" type="number" min="0" step="1" class="ui-input" />
          </FormField>
        </div>

        <label class="flex cursor-pointer items-center gap-3 rounded-[var(--l-radius)] bg-[var(--l-bg)] p-4">
          <input v-model="form.needsRepair" type="checkbox" class="h-5 w-5 accent-[var(--l-accent)]" />
          <span class="font-semibold">Está roto o necesita una reparación</span>
        </label>

        <ImageUploader :initial-image-url="form.imageUrl" @selected="handleImageSelected" />

        <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

        <button type="submit" :disabled="isSubmitting" class="ui-btn ui-btn-primary">
          {{
            isUploading
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
        <p class="menu-label mb-4 text-center">Así se verá en la casa</p>
        <div class="mx-auto max-w-xs lg:sticky lg:top-24">
          <ArticleRow :article="preview" />
        </div>
      </aside>
    </div>
    </div>
  </section>
</template>
