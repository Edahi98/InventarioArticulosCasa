<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { SystemUser } from "../core/domain/user.js";
import { listUsersUseCase } from "../core/usecases/listUsers.js";
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
  <section class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">
        <font-awesome-icon icon="user" class="mr-1" /> Gestión de usuarios
      </h1>
      <button class="cartoon-btn-primary" @click="isCreating = true">+ Usuario</button>
    </div>

    <p v-if="isLoading" class="text-slate-500">Cargando usuarios...</p>
    <p v-else-if="errorMessage" class="text-rose-600">{{ errorMessage }}</p>
    <p v-else-if="usersList.length === 0" class="text-slate-500">
      No hay usuarios registrados todavía.
    </p>

    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="user in usersList"
        :key="user.id"
        class="cartoon-card flex items-center justify-between p-4"
      >
        <div>
          <p class="font-bold text-slate-900">{{ user.username }}</p>
          <p class="text-xs text-slate-500">Creado: {{ user.createdAt }}</p>
        </div>
        <div class="flex gap-2">
          <button class="cartoon-btn-secondary px-3 py-1 text-sm" @click="editingUser = user">
            Editar
          </button>
          <button class="cartoon-btn-danger px-3 py-1 text-sm" @click="deletingUser = user">
            Eliminar
          </button>
        </div>
      </li>
    </ul>

    <UserFormModal
      v-if="isCreating"
      :user="null"
      @close="isCreating = false"
      @saved="handleSaved"
    />

    <UserFormModal
      v-if="editingUser"
      :user="editingUser"
      @close="editingUser = null"
      @saved="handleSaved"
    />

    <UserDeleteDialog
      v-if="deletingUser"
      :user="deletingUser"
      @close="deletingUser = null"
      @deleted="handleDeleted"
    />
  </section>
</template>
