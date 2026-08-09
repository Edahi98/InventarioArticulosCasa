<script setup lang="ts">
import { ref, watch } from "vue";
import { uploadArticleImageUseCase } from "../core/usecases/uploadArticleImage.js";

const props = defineProps<{ initialImageUrl?: string }>();
const emit = defineEmits<{ uploaded: [url: string]; uploading: [isUploading: boolean] }>();

const previewUrl = ref(props.initialImageUrl ?? "");
const isUploading = ref(false);
const errorMessage = ref("");

watch(
  () => props.initialImageUrl,
  (value) => {
    if (value) {
      previewUrl.value = value;
    }
  },
);

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  previewUrl.value = URL.createObjectURL(file);
  errorMessage.value = "";
  isUploading.value = true;
  emit("uploading", true);

  try {
    const uploaded = await uploadArticleImageUseCase.execute(file);
    emit("uploaded", uploaded.url);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Error al subir la imagen.";
  } finally {
    isUploading.value = false;
    emit("uploading", false);
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium text-gray-700">Imagen</label>

    <img
      v-if="previewUrl"
      :src="previewUrl"
      alt="Vista previa"
      class="h-40 w-40 rounded-md object-cover"
    />

    <input
      type="file"
      accept="image/*"
      class="block w-full text-sm text-gray-600"
      @change="handleFileChange"
    />

    <p v-if="isUploading" class="text-sm text-gray-500">Subiendo imagen...</p>
    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
  </div>
</template>
