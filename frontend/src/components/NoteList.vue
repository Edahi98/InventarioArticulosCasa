<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { Note } from "../core/domain/note.js";
import { createNoteUseCase } from "../core/usecases/createNote.js";
import { noteForm } from "../validators/noteValidators.js";
import { useFormSubmit } from "../composables/useFormSubmit.js";
import { useNotes } from "../composables/useNotes.js";
import NoteActionModal from "./notes/NoteActionModal.vue";

const props = defineProps<{ articleId: number }>();

const POSTIT_COLORS = ["#ffe98a", "#ffb3cb", "#cdbaf7", "#bfe9d5"];
const POSTIT_TILTS = [-1.6, 1.2, -0.6, 1.8];

const { notes, isLoading, loadError, load, replace, remove } = useNotes(() => props.articleId);
const { isSubmitting, errorMessage: formError, fieldErrors, validate, submit } = useFormSubmit();
const errorMessage = computed(() => formError.value || loadError.value);

const activeNote = ref<Note | null>(null);
const activeMode = ref<"edit" | "delete">("edit");

const form = reactive({
  title: "",
  description: "",
});

async function handleSubmit(): Promise<void> {
  const data = validate(noteForm, { title: form.title, description: form.description });
  if (!data) return;

  const saved = await submit(async () => {
    await createNoteUseCase.execute({ ...data, articleId: props.articleId });
  }, "No se pudo guardar la nota.");
  if (!saved) return;

  form.title = "";
  form.description = "";
  await load();
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
  replace(updated);
  closeModal();
}

function handleDeleted(id: number): void {
  remove(id);
  closeModal();
}
</script>

<template>
  <section class="space-y-8">
    <h2 class="ui-sign text-4xl">Notas pegadas</h2>

    <form
      class="ui-notebook flex flex-col gap-3 py-7 pr-6"
      @submit.prevent="handleSubmit"
    >
      <p class="font-semibold">Pega una nota nueva</p>
      <input v-model="form.title" type="text" placeholder="¿Qué quieres recordar?" class="ui-input" aria-label="Título de la nota" />
      <p v-if="fieldErrors.title" role="alert" class="ui-error">{{ fieldErrors.title }}</p>
      <textarea v-model="form.description" rows="2" placeholder="Los detalles, si hay" class="ui-input" aria-label="Detalles de la nota" />
      <p v-if="fieldErrors.description" role="alert" class="ui-error">{{ fieldErrors.description }}</p>
      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" :disabled="isSubmitting" class="ui-btn ui-btn-primary">
          {{ isSubmitting ? "Pegando..." : "Pegar nota" }}
        </button>
        <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
      </div>
    </form>

    <p v-if="isLoading" class="text-[var(--l-muted)]">Los guardianes están buscando las notas...</p>
    <p v-else-if="notes.length === 0" class="text-[var(--l-muted)]">
      Todavía no hay notas. Aquí caben la garantía, el color o a quién se lo prestaste.
    </p>

    <ul v-else class="grid grid-cols-1 gap-8 pt-2 sm:grid-cols-2">
      <li
        v-for="(note, index) in notes"
        :key="note.id"
        class="ui-postit flex flex-col gap-3 p-6 pt-8"
        :style="{
          background: POSTIT_COLORS[index % POSTIT_COLORS.length],
          transform: `rotate(${POSTIT_TILTS[index % POSTIT_TILTS.length]}deg)`,
        }"
      >
        <h3 class="text-lg font-semibold leading-snug">{{ note.title }}</h3>
        <p class="text-sm leading-relaxed">{{ note.description }}</p>
        <p class="text-xs opacity-60">{{ note.createdAt }}</p>
        <div class="mt-1 flex gap-2">
          <button
            type="button"
            class="rounded-full bg-[#fffaf2]/70 px-3 py-1 text-xs font-semibold hover:bg-[#fffaf2]"
            @click="openEditModal(note)"
          >
            Editar
          </button>
          <button
            type="button"
            class="rounded-full bg-[#fffaf2]/70 px-3 py-1 text-xs font-semibold hover:bg-[#fffaf2]"
            @click="openDeleteModal(note)"
          >
            Quitar
          </button>
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
