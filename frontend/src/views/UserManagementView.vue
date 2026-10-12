<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { SystemUser } from "../core/domain/user.js";
import { listUsersUseCase } from "../core/usecases/listUsers.js";
import { roomTone } from "../utils/roomTone.js";
import UserFormModal from "../components/users/UserFormModal.vue";
import UserDeleteDialog from "../components/users/UserDeleteDialog.vue";
import PageHeader from "../components/ui/PageHeader.vue";

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
  <section class="mx-auto max-w-5xl px-4 py-12 md:px-8">
    <PageHeader
      title="Quién vive en la casa"
      subtitle="Los habitantes que tienen llave para entrar al inventario."
    />

    <p v-if="isLoading" class="text-[var(--l-muted)]">Los guardianes están contando a los habitantes...</p>
    <p v-else-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

    <ul v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="user in usersList"
        :key="user.id"
        class="flex flex-col gap-5 rounded-[var(--l-radius)] p-6 text-[var(--l-tag-ink)]"
        :style="{ background: roomTone(user.id).wall }"
      >
        <div class="flex items-center gap-4">
          <span
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-semibold uppercase"
            :style="{ background: roomTone(user.id).rug }"
            aria-hidden="true"
          >
            {{ user.username.charAt(0) }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold">{{ user.username }}</p>
            <p class="text-xs opacity-70">Vive aquí desde {{ user.createdAt }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-full bg-[#fffaf2]/75 px-4 py-1.5 text-sm font-semibold hover:bg-[#fffaf2]"
            @click="editingUser = user"
          >
            Editar
          </button>
          <button
            type="button"
            class="rounded-full bg-[#fffaf2]/75 px-4 py-1.5 text-sm font-semibold hover:bg-[#fffaf2]"
            @click="deletingUser = user"
          >
            Quitar la llave
          </button>
        </div>
      </li>

      <li>
        <button type="button" class="ui-dashed-add h-full w-full" @click="isCreating = true">
          <span class="text-3xl font-semibold" aria-hidden="true">+</span>
          <span class="font-semibold text-[var(--l-ink)]">Invitar a alguien</span>
          <span class="text-sm">
            {{ usersList.length === 0 ? "Aún no vive nadie aquí." : "Le damos una llave nueva." }}
          </span>
        </button>
      </li>
    </ul>

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
