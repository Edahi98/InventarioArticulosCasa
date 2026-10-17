<script setup lang="ts">
import { reactive } from "vue";
import type { SystemUser } from "../../core/domain/user.js";
import { createUserUseCase } from "../../core/usecases/createUser.js";
import { updateUserUseCase } from "../../core/usecases/updateUser.js";
import { useFormSubmit } from "../../composables/useFormSubmit.js";
import { userCreateForm, userUpdateForm } from "../../validators/userValidators.js";
import FormField from "../ui/FormField.vue";
import ModalShell from "../ui/ModalShell.vue";

const props = defineProps<{ user: SystemUser | null }>();
const emit = defineEmits<{ close: []; saved: [user: SystemUser] }>();

const isEditMode = props.user !== null;

const form = reactive({
  username: props.user?.username ?? "",
  password: "",
});

const { isSubmitting, errorMessage, fieldErrors, validate, submit } = useFormSubmit();

async function handleSubmit(): Promise<void> {
  const data = validate(isEditMode ? userUpdateForm : userCreateForm, { username: form.username, password: form.password }) as {
    username: string;
    password?: string;
  } | null;
  if (!data) return;

  await submit(async () => {
    const saved =
      isEditMode && props.user
        ? await updateUserUseCase.execute(props.user.id, { username: data.username, password: data.password })
        : await createUserUseCase.execute({ username: data.username, password: data.password ?? "" });
    emit("saved", saved);
  }, "No se pudo guardar el usuario.");
}
</script>

<template>
  <ModalShell :title="isEditMode ? 'Cambiar datos del habitante' : 'Un habitante nuevo'" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <FormField label="Usuario" for-id="username" :error="fieldErrors.username">
        <input id="username" v-model="form.username" type="text" autocomplete="off" class="ui-input" />
      </FormField>
      <FormField
        :label="isEditMode ? 'Nueva contraseña' : 'Contraseña'"
        for-id="password"
        :error="fieldErrors.password"
        :hint="isEditMode ? 'Déjala en blanco para conservar la actual.' : undefined"
      >
        <input id="password" v-model="form.password" type="password" autocomplete="new-password" class="ui-input" />
      </FormField>
      <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>
    </div>

    <template #actions>
      <button type="button" class="ui-btn ui-btn-ghost" :disabled="isSubmitting" @click="emit('close')">
        Cancelar
      </button>
      <button type="button" class="ui-btn ui-btn-primary" :disabled="isSubmitting" @click="handleSubmit">
        {{ isSubmitting ? "Guardando..." : "Guardar" }}
      </button>
    </template>
  </ModalShell>
</template>
