<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { Category } from "../../core/domain/category.js";
import { updateCategoryUseCase } from "../../core/usecases/updateCategory.js";
import ImageUploader from "../ImageUploader.vue";
import FormField from "../ui/FormField.vue";
import ModalShell from "../ui/ModalShell.vue";

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
    errorMessage.value = "El cuarto necesita un nombre.";
    return;
  }
  if (isImageUploading.value) {
    errorMessage.value = "Espera a que la foto termine de subir.";
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
  <ModalShell title="Arreglar el cuarto" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <FormField label="Nombre" for-id="category-name">
        <input id="category-name" v-model="form.name" type="text" class="ui-input" />
      </FormField>
      <FormField label="Descripción" for-id="category-description">
        <textarea id="category-description" v-model="form.description" rows="3" class="ui-input" />
      </FormField>
      <ImageUploader
        :initial-image-url="form.imageUrl"
        @uploaded="handleImageUploaded"
        @uploading="handleImageUploadingChange"
      />
      <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
    </div>

    <template #actions>
      <button type="button" class="ui-btn ui-btn-ghost" :disabled="isSubmitting" @click="emit('close')">
        Cancelar
      </button>
      <button
        type="button"
        class="ui-btn ui-btn-primary"
        :disabled="isSubmitting || isImageUploading"
        @click="handleSubmit"
      >
        {{ isSubmitting ? "Guardando..." : "Guardar cambios" }}
      </button>
    </template>
  </ModalShell>
</template>
