<script setup lang="ts">
import { ref } from "vue";
import type { Article } from "../../core/domain/article.js";
import { deleteArticleUseCase } from "../../core/usecases/deleteArticle.js";
import ModalShell from "../ui/ModalShell.vue";

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
  <ModalShell title="Eliminar artículo" @close="emit('close')">
    <p class="leading-relaxed text-[var(--l-muted)]">
      ¿Seguro que quieres eliminar "<strong class="text-[var(--l-ink)]">{{ article.name }}</strong>"?
      Esta acción es permanente y no se puede deshacer.
    </p>
    <p v-if="errorMessage" role="alert" class="ui-error mt-4">{{ errorMessage }}</p>

    <template #actions>
      <button type="button" class="ui-btn ui-btn-ghost" :disabled="isDeleting" @click="emit('close')">
        Cancelar
      </button>
      <button type="button" class="ui-btn ui-btn-primary" :disabled="isDeleting" @click="handleConfirmDelete">
        {{ isDeleting ? "Eliminando..." : "Eliminar" }}
      </button>
    </template>
  </ModalShell>
</template>
