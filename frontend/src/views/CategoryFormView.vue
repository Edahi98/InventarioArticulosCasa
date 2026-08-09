<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createCategoryUseCase } from "../core/usecases/createCategory.js";
import { updateCategoryUseCase } from "../core/usecases/updateCategory.js";
import { getCategoryByIdUseCase } from "../core/usecases/getCategoryById.js";
import ImageUploader from "../components/ImageUploader.vue";

const router = useRouter();
const route = useRoute();

const categoryId = route.params.id ? Number(route.params.id) : null;
const isEditMode = computed(() => categoryId !== null);

const form = reactive({
  name: "",
  description: "",
  imageUrl: "",
});

const isLoading = ref(isEditMode.value);
const isSubmitting = ref(false);
const isImageUploading = ref(false);
const errorMessage = ref("");

onMounted(async () => {
  if (!categoryId) return;
  try {
    const category = await getCategoryByIdUseCase.execute(categoryId);
    form.name = category.name;
    form.description = category.description;
    form.imageUrl = category.imageUrl;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo cargar la categoría.";
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

  if (!form.name.trim()) {
    errorMessage.value = "El nombre de la categoría es obligatorio.";
    return;
  }

  if (isImageUploading.value) {
    errorMessage.value = "Espera a que la imagen termine de subir.";
    return;
  }

  if (!form.imageUrl) {
    errorMessage.value = "Debes subir una imagen antes de guardar la categoría.";
    return;
  }

  isSubmitting.value = true;
  try {
    const input = {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
    };

    if (categoryId) {
      await updateCategoryUseCase.execute(categoryId, input);
      router.push(`/categories/${categoryId}/articles`);
    } else {
      await createCategoryUseCase.execute(input);
      router.push("/categories");
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo guardar la categoría.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="mb-6 text-2xl font-extrabold text-slate-900">
      {{ isEditMode ? "Editar categoría" : "Nueva categoría" }}
    </h1>

    <p v-if="isLoading" class="text-slate-500">Cargando categoría...</p>

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
                : "Guardar categoría"
        }}
      </button>
    </form>
  </section>
</template>
