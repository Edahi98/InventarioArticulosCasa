<script setup lang="ts">
import { reactive, watch } from "vue";
import type { Category } from "../../core/domain/category.js";
import { updateCategoryUseCase } from "../../core/usecases/updateCategory.js";
import { categoryForm } from "../../validators/categoryValidators.js";
import { useFormSubmit } from "../../composables/useFormSubmit.js";
import { useImageUpload } from "../../composables/useImageUpload.js";
import ImageUploader from "../ImageUploader.vue";
import FormField from "../ui/FormField.vue";
import ModalShell from "../ui/ModalShell.vue";

const props = defineProps<{ category: Category }>();
const emit = defineEmits<{ close: []; saved: [category: Category] }>();

const form = reactive({
  name: props.category.name,
  description: props.category.description,
  location: props.category.location,
  imageUrl: props.category.imageUrl,
});

const { isSubmitting, errorMessage, fieldErrors, validate, submit } = useFormSubmit();
const { isUploading, select: handleImageSelected, resolveUrl, reset: resetImage } = useImageUpload(() => form.imageUrl);

watch(
  () => props.category,
  (category) => {
    form.name = category.name;
    form.description = category.description;
    form.location = category.location;
    form.imageUrl = category.imageUrl;
    resetImage();
  },
);

async function handleSubmit(): Promise<void> {
  const data = validate(categoryForm, { name: form.name, description: form.description, location: form.location });
  if (!data) return;

  await submit(async () => {
    const updated = await updateCategoryUseCase.execute(props.category.id, { ...data, imageUrl: await resolveUrl() });
    emit("saved", updated);
  }, "No se pudo actualizar la categoría.");
}
</script>

<template>
  <ModalShell title="Arreglar el cuarto" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <FormField label="Nombre" for-id="category-name" :error="fieldErrors.name">
        <input id="category-name" v-model="form.name" type="text" class="ui-input" />
      </FormField>
      <FormField label="Descripción" for-id="category-description" :error="fieldErrors.description">
        <textarea id="category-description" v-model="form.description" rows="3" class="ui-input" />
      </FormField>
      <FormField label="Ubicación" for-id="category-location" :error="fieldErrors.location">
        <input id="category-location" v-model="form.location" type="text" class="ui-input" />
      </FormField>
      <ImageUploader :initial-image-url="form.imageUrl" @selected="handleImageSelected" />
      <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
    </div>

    <template #actions>
      <button type="button" class="ui-btn ui-btn-ghost" :disabled="isSubmitting" @click="emit('close')">
        Cancelar
      </button>
      <button type="button" class="ui-btn ui-btn-primary" :disabled="isSubmitting" @click="handleSubmit">
        {{ isUploading ? "Subiendo la foto..." : isSubmitting ? "Guardando..." : "Guardar cambios" }}
      </button>
    </template>
  </ModalShell>
</template>
