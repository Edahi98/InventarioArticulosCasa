<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { Note } from "../../core/domain/note.js";
import { updateNoteUseCase } from "../../core/usecases/updateNote.js";
import { deleteNoteUseCase } from "../../core/usecases/deleteNote.js";
import { noteForm } from "../../validators/noteValidators.js";
import { validateInput } from "../../validators/validateInput.js";
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

const isSubmitting = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string>>({});

watch(
  () => props.note,
  (note) => {
    form.title = note.title;
    form.description = note.description;
  },
);

async function handleConfirmEdit(): Promise<void> {
  errorMessage.value = "";
  fieldErrors.value = {};

  const checked = validateInput(noteForm, { title: form.title, description: form.description });
  if (!checked.ok) {
    fieldErrors.value = checked.failure.fields;
    errorMessage.value = checked.failure.message;
    return;
  }

  isSubmitting.value = true;
  try {
    const updated = await updateNoteUseCase.execute(props.note.id, checked.data);
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
