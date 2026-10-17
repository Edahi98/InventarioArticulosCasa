<script setup lang="ts">
import { reactive, watch } from "vue";
import type { Note } from "../../core/domain/note.js";
import { updateNoteUseCase } from "../../core/usecases/updateNote.js";
import { deleteNoteUseCase } from "../../core/usecases/deleteNote.js";
import { useFormSubmit } from "../../composables/useFormSubmit.js";
import { noteForm } from "../../validators/noteValidators.js";
import FormField from "../ui/FormField.vue";
import ModalShell from "../ui/ModalShell.vue";

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

const { isSubmitting, errorMessage, fieldErrors, validate, submit, reset } = useFormSubmit();

watch(
  () => props.note,
  (note) => {
    form.title = note.title;
    form.description = note.description;
  },
);

async function handleConfirmEdit(): Promise<void> {
  const data = validate(noteForm, { title: form.title, description: form.description });
  if (!data) return;

  await submit(async () => {
    emit("saved", await updateNoteUseCase.execute(props.note.id, data));
  }, "No se pudo actualizar la nota.");
}

async function handleConfirmDelete(): Promise<void> {
  reset();
  await submit(async () => {
    await deleteNoteUseCase.execute(props.note.id);
    emit("deleted", props.note.id);
  }, "No se pudo eliminar la nota.");
}
</script>

<template>
  <ModalShell v-if="mode === 'edit'" title="Reescribir la nota" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <FormField label="Título" for-id="note-title" :error="fieldErrors.title">
        <input id="note-title" v-model="form.title" type="text" class="ui-input" />
      </FormField>
      <FormField label="Detalles" for-id="note-description" :error="fieldErrors.description">
        <textarea id="note-description" v-model="form.description" rows="3" class="ui-input" />
      </FormField>
      <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
    </div>

    <template #actions>
      <button type="button" class="ui-btn ui-btn-ghost" :disabled="isSubmitting" @click="emit('close')">
        Cancelar
      </button>
      <button type="button" class="ui-btn ui-btn-primary" :disabled="isSubmitting" @click="handleConfirmEdit">
        {{ isSubmitting ? "Guardando..." : "Guardar" }}
      </button>
    </template>
  </ModalShell>

  <ModalShell v-else title="¿Despegar esta nota?" @close="emit('close')">
    <p class="leading-relaxed text-[var(--l-muted)]">
      La nota "<strong class="text-[var(--l-ink)]">{{ note.title }}</strong>" se quita para siempre.
    </p>
    <p v-if="errorMessage" role="alert" class="ui-error mt-4">{{ errorMessage }}</p>

    <template #actions>
      <button type="button" class="ui-btn ui-btn-ghost" :disabled="isSubmitting" @click="emit('close')">
        Mejor no
      </button>
      <button type="button" class="ui-btn ui-btn-primary" :disabled="isSubmitting" @click="handleConfirmDelete">
        {{ isSubmitting ? "Quitando..." : "Despegar" }}
      </button>
    </template>
  </ModalShell>
</template>
