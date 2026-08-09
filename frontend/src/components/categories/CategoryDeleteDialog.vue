<script setup lang="ts">
import { ref } from "vue";
import type { Category } from "../../core/domain/category.js";
import { deleteCategoryUseCase } from "../../core/usecases/deleteCategory.js";

const props = defineProps<{ category: Category }>();
const emit = defineEmits<{ close: []; deleted: [id: number] }>();

const isDeleting = ref(false);
const errorMessage = ref("");

async function handleConfirmDelete(): Promise<void> {
  errorMessage.value = "";
  isDeleting.value = true;
  try {
    await deleteCategoryUseCase.execute(props.category.id);
    emit("deleted", props.category.id);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo eliminar la categoría.";
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div class="cartoon-panel w-full max-w-md p-6">
      <h2 class="mb-3 text-xl font-extrabold text-slate-900">
        <font-awesome-icon icon="trash" class="mr-1" /> Eliminar categoría
      </h2>
      <p class="mb-4 text-slate-700">
        ¿Seguro que quieres eliminar "<strong>{{ category.name }}</strong>"? Esta acción no se puede deshacer.
      </p>

      <div
        v-if="errorMessage"
        class="mb-4 rounded-xl border-4 border-slate-900 bg-amber-200 p-3 text-sm font-semibold text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
      >
        <font-awesome-icon icon="triangle-exclamation" class="mr-1" /> {{ errorMessage }}
      </div>

      <div class="flex justify-end gap-2">
        <button class="cartoon-btn-secondary" :disabled="isDeleting" @click="emit('close')">
          Cancelar
        </button>
        <button class="cartoon-btn-danger" :disabled="isDeleting" @click="handleConfirmDelete">
          {{ isDeleting ? "Eliminando..." : "Eliminar" }}
        </button>
      </div>
    </div>
  </div>
</template>
