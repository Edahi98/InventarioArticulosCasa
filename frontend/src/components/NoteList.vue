<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { Note } from "../core/domain/note.js";
import { listNotesByArticleUseCase } from "../core/usecases/listNotesByArticle.js";
import { createNoteUseCase } from "../core/usecases/createNote.js";
import NoteActionModal from "./notes/NoteActionModal.vue";

const props = defineProps<{ articleId: number }>();

const notes = ref<Note[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const isSubmitting = ref(false);

const activeNote = ref<Note | null>(null);
const activeMode = ref<"edit" | "delete">("edit");

const form = reactive({
  title: "",
  description: "",
});

async function loadNotes(): Promise<void> {
  isLoading.value = true;
  try {
    notes.value = await listNotesByArticleUseCase.execute(props.articleId);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Error al cargar las notas.";
  } finally {
    isLoading.value = false;
  }
}

async function handleSubmit(): Promise<void> {
  if (!form.title.trim()) {
    errorMessage.value = "El título de la nota es obligatorio.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";
  try {
    await createNoteUseCase.execute({
      title: form.title,
      description: form.description,
      articleId: props.articleId,
    });
    form.title = "";
    form.description = "";
    await loadNotes();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "No se pudo guardar la nota.";
  } finally {
    isSubmitting.value = false;
  }
}

function openEditModal(note: Note): void {
  activeNote.value = note;
  activeMode.value = "edit";
}

function openDeleteModal(note: Note): void {
  activeNote.value = note;
  activeMode.value = "delete";
}

function closeModal(): void {
  activeNote.value = null;
}

function handleSaved(updated: Note): void {
  const index = notes.value.findIndex((note) => note.id === updated.id);
  if (index !== -1) {
    notes.value[index] = updated;
  }
  closeModal();
}

function handleDeleted(id: number): void {
  notes.value = notes.value.filter((note) => note.id !== id);
  closeModal();
}

onMounted(loadNotes);
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="text-xl font-extrabold text-slate-900">Notas</h2>

    <form class="cartoon-panel flex flex-col gap-2 p-4" @submit.prevent="handleSubmit">
      <input
        v-model="form.title"
        type="text"
        placeholder="Título de la nota"
        class="cartoon-input"
      />
      <textarea
        v-model="form.description"
        rows="2"
        placeholder="Descripción"
        class="cartoon-input"
      />
      <button
        type="submit"
        :disabled="isSubmitting"
        class="cartoon-btn-primary self-start disabled:opacity-50"
      >
        {{ isSubmitting ? "Guardando..." : "Añadir nota" }}
      </button>
      <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>
    </form>

    <p v-if="isLoading" class="text-slate-500">Cargando notas...</p>
    <p v-else-if="notes.length === 0" class="text-slate-500">No hay notas registradas todavía.</p>

    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="note in notes"
        :key="note.id"
        class="cartoon-card p-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-extrabold text-slate-900">{{ note.title }}</h3>
            <p class="text-sm text-slate-600">{{ note.description }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ note.createdAt }}</p>
          </div>
          <div class="flex shrink-0 gap-1">
            <button
              class="cartoon-btn-secondary px-2 py-1 text-xs"
              @click="openEditModal(note)"
            >
              Editar
            </button>
            <button
              class="cartoon-btn-danger px-2 py-1 text-xs"
              @click="openDeleteModal(note)"
            >
              Eliminar
            </button>
          </div>
        </div>
      </li>
    </ul>

    <NoteActionModal
      v-if="activeNote"
      :note="activeNote"
      :mode="activeMode"
      @close="closeModal"
      @saved="handleSaved"
      @deleted="handleDeleted"
    />
  </section>
</template>
