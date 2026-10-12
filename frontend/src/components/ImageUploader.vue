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
    <span class="ui-label">Foto</span>

    <label
      class="ui-dashed-add cursor-pointer !min-h-[10rem] focus-within:border-[var(--l-accent)]"
      :class="{ '!border-solid': previewUrl }"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="Vista previa"
        class="h-32 w-32 rounded-xl border-4 border-[#fffaf2] object-cover"
      />
      <span class="text-sm font-semibold">
        {{ isUploading ? "Subiendo la foto..." : previewUrl ? "Cambiar la foto" : "Toca para elegir una foto" }}
      </span>
      <input type="file" accept="image/*" class="sr-only" @change="handleFileChange" />
    </label>

    <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
  </div>
</template>
