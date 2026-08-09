<script setup lang="ts">
import { ref } from "vue";
import type { Article } from "../../core/domain/article.js";
import { deleteArticleUseCase } from "../../core/usecases/deleteArticle.js";

const props = defineProps<{ article: Article }>();
const emit = defineEmits<{ close: []; deleted: [id: number] }>();

const isDeleting = ref(false);
const errorMessage = ref("");

async function handleConfirmDelete(): Promise<void> {
  errorMessage.value = "";
  isDeleting.value = true;
  try {
    await deleteArticleUseCase.execute(props.article.id);
    emit("deleted", props.article.id);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo eliminar el artículo.";
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div class="w-full max-w-md rounded-3xl border-4 border-slate-900 bg-rose-100 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
      <h2 class="mb-3 text-xl font-extrabold text-slate-900">
        <font-awesome-icon icon="trash" class="mr-1" /> Eliminar artículo
      </h2>
      <p class="mb-4 text-slate-800">
        ¿Seguro que quieres eliminar "<strong>{{ article.name }}</strong>"? Esta acción es
        permanente y no se puede deshacer.
      </p>

      <div
        v-if="errorMessage"
        class="mb-4 rounded-xl border-4 border-slate-900 bg-amber-200 p-3 text-sm font-semibold text-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <font-awesome-icon icon="triangle-exclamation" class="mr-1" /> {{ errorMessage }}
      </div>

      <div class="flex justify-end gap-2">
        <button
          class="rounded-xl border-4 border-slate-900 bg-lime-200 px-4 py-2 font-bold text-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
          :disabled="isDeleting"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          class="rounded-xl border-4 border-slate-900 bg-rose-400 px-4 py-2 font-bold text-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
          :disabled="isDeleting"
          @click="handleConfirmDelete"
        >
          {{ isDeleting ? "Eliminando..." : "Eliminar" }}
        </button>
      </div>
    </div>
  </div>
</template>
