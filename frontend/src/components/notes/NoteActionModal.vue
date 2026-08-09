<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { Note } from "../../core/domain/note.js";
import { updateNoteUseCase } from "../../core/usecases/updateNote.js";
import { deleteNoteUseCase } from "../../core/usecases/deleteNote.js";

const props = defineProps<{ note: Note; mode: "edit" | "delete" }>();
const emit = defineEmits<{
  close: [];
  saved: [note: Note];
  deleted: [id: number];
}>();

const form = reactive({
  title: props.note.title,
  description: props.note.description,
});

const isSubmitting = ref(false);
const errorMessage = ref("");

watch(
  () => props.note,
  (note) => {
    form.title = note.title;
    form.description = note.description;
  },
);

async function handleConfirmEdit(): Promise<void> {
  errorMessage.value = "";
  if (!form.title.trim()) {
    errorMessage.value = "El título de la nota es obligatorio.";
    return;
  }

  isSubmitting.value = true;
  try {
    const updated = await updateNoteUseCase.execute(props.note.id, {
      title: form.title,
      description: form.description,
    });
    emit("saved", updated);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo actualizar la nota.";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleConfirmDelete(): Promise<void> {
  errorMessage.value = "";
  isSubmitting.value = true;
  try {
    await deleteNoteUseCase.execute(props.note.id);
    emit("deleted", props.note.id);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo eliminar la nota.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div class="cartoon-panel w-full max-w-md p-6">
      <template v-if="mode === 'edit'">
        <h2 class="mb-4 text-xl font-extrabold text-slate-900">
          <font-awesome-icon icon="pen" class="mr-1" /> Editar nota
        </h2>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-slate-800" for="note-title">Título</label>
            <input id="note-title" v-model="form.title" type="text" class="cartoon-input" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-bold text-slate-800" for="note-description">Descripción</label>
            <textarea
              id="note-description"
              v-model="form.description"
              rows="3"
              class="cartoon-input"
            />
          </div>

          <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

          <div class="mt-2 flex justify-end gap-2">
            <button class="cartoon-btn-secondary" :disabled="isSubmitting" @click="emit('close')">
              Cancelar
            </button>
            <button class="cartoon-btn-primary" :disabled="isSubmitting" @click="handleConfirmEdit">
              {{ isSubmitting ? "Guardando..." : "Guardar" }}
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <h2 class="mb-3 text-xl font-extrabold text-slate-900">
          <font-awesome-icon icon="trash" class="mr-1" /> Eliminar nota
        </h2>
        <p class="mb-4 text-slate-700">
          ¿Seguro que quieres eliminar la nota "<strong>{{ note.title }}</strong>"? Esta acción no se puede deshacer.
        </p>

        <p v-if="errorMessage" class="mb-2 text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

        <div class="flex justify-end gap-2">
          <button class="cartoon-btn-secondary" :disabled="isSubmitting" @click="emit('close')">
            Cancelar
          </button>
          <button class="cartoon-btn-danger" :disabled="isSubmitting" @click="handleConfirmDelete">
            {{ isSubmitting ? "Eliminando..." : "Eliminar" }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
