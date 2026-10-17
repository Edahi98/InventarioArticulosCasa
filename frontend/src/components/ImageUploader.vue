<script setup lang="ts">
import { useImagePreview } from "../composables/useImagePreview.js";

const props = defineProps<{ initialImageUrl?: string }>();
const emit = defineEmits<{ selected: [file: File, previewUrl: string] }>();

const { previewUrl, errorMessage, handleFileChange } = useImagePreview(
  () => props.initialImageUrl,
  (file, url) => emit("selected", file, url),
);
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
        {{ previewUrl ? "Cambiar la foto" : "Toca para elegir una foto" }}
      </span>
      <input type="file" accept="image/*" class="sr-only" @change="handleFileChange" />
    </label>

    <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
  </div>
</template>
