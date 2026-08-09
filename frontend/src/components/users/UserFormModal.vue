<script setup lang="ts">
import { reactive, ref } from "vue";
import type { SystemUser } from "../../core/domain/user.js";
import { createUserUseCase } from "../../core/usecases/createUser.js";
import { updateUserUseCase } from "../../core/usecases/updateUser.js";

const props = defineProps<{ user: SystemUser | null }>();
const emit = defineEmits<{ close: []; saved: [user: SystemUser] }>();

const isEditMode = props.user !== null;

const form = reactive({
  username: props.user?.username ?? "",
  password: "",
});

const isSubmitting = ref(false);
const errorMessage = ref("");

async function handleSubmit(): Promise<void> {
  errorMessage.value = "";

  if (!form.username.trim()) {
    errorMessage.value = "El nombre de usuario es obligatorio.";
    return;
  }
  if (!isEditMode && !form.password.trim()) {
    errorMessage.value = "La contraseña es obligatoria para un usuario nuevo.";
    return;
  }

  isSubmitting.value = true;
  try {
    let saved: SystemUser;
    if (isEditMode && props.user) {
      saved = await updateUserUseCase.execute(props.user.id, {
        username: form.username,
        password: form.password.trim() ? form.password : undefined,
      });
    } else {
      saved = await createUserUseCase.execute({
        username: form.username,
        password: form.password,
      });
    }
    emit("saved", saved);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo guardar el usuario.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div class="cartoon-panel w-full max-w-md p-6">
      <h2 class="mb-4 text-xl font-extrabold text-slate-900">
        <font-awesome-icon :icon="isEditMode ? 'pen' : 'plus'" class="mr-1" />
        {{ isEditMode ? "Editar usuario" : "Nuevo usuario" }}
      </h2>

      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-slate-800" for="username">Usuario</label>
          <input id="username" v-model="form.username" type="text" class="cartoon-input" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-slate-800" for="password">
            {{ isEditMode ? "Nueva contraseña (opcional)" : "Contraseña" }}
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="cartoon-input"
            :placeholder="isEditMode ? 'Déjalo en blanco para no cambiarla' : ''"
          />
        </div>

        <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>

        <div class="mt-2 flex justify-end gap-2">
          <button class="cartoon-btn-secondary" :disabled="isSubmitting" @click="emit('close')">
            Cancelar
          </button>
          <button class="cartoon-btn-primary" :disabled="isSubmitting" @click="handleSubmit">
            {{ isSubmitting ? "Guardando..." : "Guardar" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
