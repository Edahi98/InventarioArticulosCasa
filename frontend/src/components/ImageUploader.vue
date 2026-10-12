<script setup lang="ts">
import { ref, watch } from "vue";
import { validateImageFile } from "../validators/imageValidators.js";

const props = defineProps<{ initialImageUrl?: string }>();
const emit = defineEmits<{ selected: [file: File, previewUrl: string] }>();

const previewUrl = ref(props.initialImageUrl ?? "");
const errorMessage = ref("");

watch(
  () => props.initialImageUrl,
  (value) => {
    if (value && !previewUrl.value.startsWith("data:")) {
      previewUrl.value = value;
    }
  },
);

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer la foto."));
    reader.readAsDataURL(file);
  });
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  errorMessage.value = "";
  const problem = await validateImageFile(file);
  if (problem) {
    errorMessage.value = problem;
    input.value = "";
    return;
  }

  try {
    previewUrl.value = await readAsDataUrl(file);
    emit("selected", file, previewUrl.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "No se pudo leer la foto.";
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
        {{ previewUrl ? "Cambiar la foto" : "Toca para elegir una foto" }}
      </span>
      <input type="file" accept="image/*" class="sr-only" @change="handleFileChange" />
    </label>

    <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
  </div>
</template>
