<script setup lang="ts">
import { reactive, ref } from "vue";
import type { SystemUser } from "../../core/domain/user.js";
import { createUserUseCase } from "../../core/usecases/createUser.js";
import { updateUserUseCase } from "../../core/usecases/updateUser.js";
import { userCreateForm, userUpdateForm } from "../../validators/userValidators.js";
import { validateInput } from "../../validators/validateInput.js";
import FormField from "../ui/FormField.vue";
import ModalShell from "../ui/ModalShell.vue";

const props = defineProps<{ user: SystemUser | null }>();
const emit = defineEmits<{ close: []; saved: [user: SystemUser] }>();

const isEditMode = props.user !== null;

const form = reactive({
  username: props.user?.username ?? "",
  password: "",
});

const isSubmitting = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string>>({});

async function handleSubmit(): Promise<void> {
  errorMessage.value = "";
  fieldErrors.value = {};

  const checked = validateInput(isEditMode ? userUpdateForm : userCreateForm, {
    username: form.username,
    password: form.password,
  });
  if (!checked.ok) {
    fieldErrors.value = checked.failure.fields;
    errorMessage.value = checked.failure.message;
    return;
  }
  const { username, password } = checked.data as { username: string; password?: string };

  isSubmitting.value = true;
  try {
    let saved: SystemUser;
    if (isEditMode && props.user) {
      saved = await updateUserUseCase.execute(props.user.id, { username, password });
    } else {
      saved = await createUserUseCase.execute({ username, password: password ?? "" });
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
