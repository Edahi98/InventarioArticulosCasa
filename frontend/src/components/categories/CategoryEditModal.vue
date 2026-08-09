<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { Category } from "../../core/domain/category.js";
import { updateCategoryUseCase } from "../../core/usecases/updateCategory.js";
import ImageUploader from "../ImageUploader.vue";

const props = defineProps<{ category: Category }>();
const emit = defineEmits<{ close: []; saved: [category: Category] }>();

const form = reactive({
  name: props.category.name,
  description: props.category.description,
  imageUrl: props.category.imageUrl,
});

const isSubmitting = ref(false);
const isImageUploading = ref(false);
const errorMessage = ref("");

watch(
  () => props.category,
  (category) => {
    form.name = category.name;
    form.description = category.description;
    form.imageUrl = category.imageUrl;
  },
);

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

  isSubmitting.value = true;
  try {
    const updated = await updateCategoryUseCase.execute(props.category.id, {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
    });
    emit("saved", updated);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo actualizar la categoría.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div class="cartoon-panel w-full max-w-md p-6">
      <h2 class="mb-4 text-xl font-extrabold text-slate-900">
        <font-awesome-icon icon="pen" class="mr-1" /> Editar categoría
      </h2>

      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-slate-800" for="category-name">Nombre</label>
          <input id="category-name" v-model="form.name" type="text" class="cartoon-input" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-slate-800" for="category-description">
            Descripción
          </label>
          <textarea
            id="category-description"
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

        <div class="mt-2 flex justify-end gap-2">
          <button class="cartoon-btn-secondary" :disabled="isSubmitting" @click="emit('close')">
            Cancelar
          </button>
          <button
            class="cartoon-btn-primary"
            :disabled="isSubmitting || isImageUploading"
            @click="handleSubmit"
          >
            {{ isSubmitting ? "Guardando..." : "Guardar cambios" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
