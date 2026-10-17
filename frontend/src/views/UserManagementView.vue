<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { SystemUser } from "../core/domain/user.js";
import { listUsersUseCase } from "../core/usecases/listUsers.js";
import { roomTone } from "../utils/roomTone.js";
import UserFormModal from "../components/users/UserFormModal.vue";
import UserDeleteDialog from "../components/users/UserDeleteDialog.vue";

const usersList = ref<SystemUser[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const isCreating = ref(false);
const editingUser = ref<SystemUser | null>(null);
const deletingUser = ref<SystemUser | null>(null);

async function loadUsers(): Promise<void> {
  isLoading.value = true;
  try {
    usersList.value = await listUsersUseCase.execute();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Error al cargar los usuarios.";
  } finally {
    isLoading.value = false;
  }
}

function handleSaved(saved: SystemUser): void {
  const index = usersList.value.findIndex((user) => user.id === saved.id);
  if (index !== -1) {
    usersList.value[index] = saved;
  } else {
    usersList.value.push(saved);
  }
  isCreating.value = false;
  editingUser.value = null;
}

function handleDeleted(id: number): void {
  usersList.value = usersList.value.filter((user) => user.id !== id);
  deletingUser.value = null;
}

onMounted(loadUsers);
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 pb-12 pt-20 md:px-8">
    <div class="menu-panel">
      <header class="menu-title">
        <h1 class="ui-sign text-4xl leading-none md:text-5xl">Quién vive en la casa</h1>
      </header>
      <p class="menu-label text-center">Elige a un habitante</p>
      <p class="mb-5 mt-2 text-center font-semibold text-[var(--l-muted)]">
        Los habitantes que tienen llave para entrar al inventario.
      </p>

      <p v-if="isLoading" class="text-center text-[var(--l-muted)]">Los guardianes están contando a los habitantes...</p>
      <p v-else-if="errorMessage" role="alert" class="ui-error text-center">{{ errorMessage }}</p>

      <ul v-else class="grid gap-3">
        <li v-for="user in usersList" :key="user.id" class="menu-slot flex-wrap">
          <span
            class="menu-badge !h-12 !w-12 text-xl uppercase"
            :style="{ background: roomTone(user.id).rug }"
            aria-hidden="true"
          >
            {{ user.username.charAt(0) }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-extrabold">{{ user.username }}</p>
            <p class="text-xs font-semibold text-[var(--l-muted)]">Vive aquí desde {{ user.createdAt }}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost" @click="editingUser = user">Editar</button>
            <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost" @click="deletingUser = user">Quitar la llave</button>
          </div>
        </li>

        <li>
          <button type="button" class="ui-btn ui-btn-primary mt-2 w-full justify-center" @click="isCreating = true">
            Invitar a alguien
          </button>
          <p v-if="usersList.length === 0" class="mt-3 text-center text-sm text-[var(--l-muted)]">Aún no vive nadie aquí.</p>
        </li>
      </ul>
    </div>

    <UserFormModal v-if="isCreating" :user="null" @close="isCreating = false" @saved="handleSaved" />

    <UserFormModal v-if="editingUser" :user="editingUser" @close="editingUser = null" @saved="handleSaved" />

    <UserDeleteDialog
      v-if="deletingUser"
      :user="deletingUser"
      @close="deletingUser = null"
      @deleted="handleDeleted"
    />
  </section>
</template>
