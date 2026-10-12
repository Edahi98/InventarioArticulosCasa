<script setup lang="ts">
import { ref } from "vue";
import type { SystemUser } from "../../core/domain/user.js";
import { deleteUserUseCase } from "../../core/usecases/deleteUser.js";
import ModalShell from "../ui/ModalShell.vue";

const props = defineProps<{ user: SystemUser }>();
const emit = defineEmits<{ close: []; deleted: [id: number] }>();

const isDeleting = ref(false);
const errorMessage = ref("");

async function handleConfirmDelete(): Promise<void> {
  errorMessage.value = "";
  isDeleting.value = true;
  try {
    await deleteUserUseCase.execute(props.user.id);
    emit("deleted", props.user.id);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo eliminar el usuario.";
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <ModalShell title="Eliminar usuario" @close="emit('close')">
    <p class="leading-relaxed text-[var(--l-muted)]">
      ¿Seguro que quieres eliminar a "<strong class="text-[var(--l-ink)]">{{ user.username }}</strong>"?
      Su sesión activa quedará invalidada de inmediato.
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
