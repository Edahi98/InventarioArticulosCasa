<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { Category } from "../../core/domain/category.js";
import { updateCategoryUseCase } from "../../core/usecases/updateCategory.js";
import { uploadArticleImageUseCase } from "../../core/usecases/uploadArticleImage.js";
import { categoryForm } from "../../validators/categoryValidators.js";
import { validateInput } from "../../validators/validateInput.js";
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

const pendingFile = ref<File | null>(null);
const isSubmitting = ref(false);
const isUploading = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string>>({});

watch(
  () => props.category,
  (category) => {
    form.name = category.name;
    form.description = category.description;
    form.location = category.location;
    form.imageUrl = category.imageUrl;
    pendingFile.value = null;
  },
);

function handleImageSelected(file: File): void {
  pendingFile.value = file;
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

  const checked = validateInput(categoryForm, {
    name: form.name,
    description: form.description,
    location: form.location,
  });
  if (!checked.ok) {
    fieldErrors.value = checked.failure.fields;
    errorMessage.value = checked.failure.message;
    return;
  }

  isSubmitting.value = true;
  try {
    const updated = await updateCategoryUseCase.execute(props.category.id, {
      ...checked.data,
      imageUrl: await resolveImageUrl(),
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
