<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createCategoryUseCase } from "../core/usecases/createCategory.js";
import { updateCategoryUseCase } from "../core/usecases/updateCategory.js";
import { getCategoryByIdUseCase } from "../core/usecases/getCategoryById.js";
import { categoryForm } from "../validators/categoryValidators.js";
import { useFormSubmit } from "../composables/useFormSubmit.js";
import { useImageUpload } from "../composables/useImageUpload.js";
import CategoryCard from "../components/CategoryCard.vue";
import ImageUploader from "../components/ImageUploader.vue";
import FormField from "../components/ui/FormField.vue";
import PageHeader from "../components/ui/PageHeader.vue";

const router = useRouter();
const route = useRoute();

const categoryId = route.params.id ? Number(route.params.id) : null;
const isEditMode = computed(() => categoryId !== null);

const form = reactive({
  name: "",
  description: "",
  location: "",
  imageUrl: "",
});

const isLoading = ref(isEditMode.value);
const { isSubmitting, errorMessage, fieldErrors, validate, submit, fail } = useFormSubmit();
const { pendingPreview, isUploading, hasImage, select: handleImageSelected, resolveUrl } = useImageUpload(() => form.imageUrl);

const preview = computed(() => ({
  id: categoryId ?? 0,
  name: form.name || "El nombre del cuarto",
  description: form.description || "Aquí irá su descripción.",
  imageUrl: pendingPreview.value || form.imageUrl,
}));

onMounted(async () => {
  if (!categoryId) return;
  try {
    const category = await getCategoryByIdUseCase.execute(categoryId);
    form.name = category.name;
    form.description = category.description;
    form.location = category.location;
    form.imageUrl = category.imageUrl;
  } catch (error) {
    fail(error instanceof Error ? error.message : "No se pudo cargar la categoría.");
  } finally {
    isLoading.value = false;
  }
});

async function handleSubmit(): Promise<void> {
  const data = validate(categoryForm, { name: form.name, description: form.description, location: form.location });
  if (!data) return;
  if (!hasImage.value) {
    fail("Elige una foto del cuarto antes de guardarlo.");
    return;
  }

  await submit(async () => {
    const input = { ...data, imageUrl: await resolveUrl() };
    if (categoryId) {
      await updateCategoryUseCase.execute(categoryId, input);
      router.push(`/categories/${categoryId}/articles`);
    } else {
      await createCategoryUseCase.execute(input);
      router.push("/categories");
    }
  }, "No se pudo guardar la categoría.");
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-12 md:px-8">
    <PageHeader
      :title="isEditMode ? 'Arreglar el cuarto' : 'Construir un cuarto nuevo'"
      subtitle="Dale nombre, una foto y unas palabras. Mira a la derecha cómo va quedando."
      back-to="/categories"
      back-label="Todos los cuartos"
    />

    <p v-if="isLoading" class="text-[var(--l-muted)]">Abriendo el cuarto...</p>

    <div v-else class="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <form
        class="ui-notebook flex flex-col gap-6 py-8 pr-6 sm:pr-8 lg:col-span-7"
        @submit.prevent="handleSubmit"
      >
        <FormField label="Nombre" for-id="name" :error="fieldErrors.name">
          <input id="name" v-model="form.name" type="text" required class="ui-input" placeholder="La cocina, el taller..." />
        </FormField>

        <FormField label="Descripción" for-id="description" :error="fieldErrors.description">
          <textarea id="description" v-model="form.description" rows="3" class="ui-input" placeholder="¿Qué se guarda aquí?" />
        </FormField>

        <FormField label="Ubicación" for-id="location" :error="fieldErrors.location">
          <input id="location" v-model="form.location" type="text" class="ui-input" placeholder="Planta alta, junto a la escalera..." />
        </FormField>

        <ImageUploader :initial-image-url="form.imageUrl" @selected="handleImageSelected" />

        <p v-if="errorMessage" role="alert" class="ui-error">{{ errorMessage }}</p>

        <button type="submit" :disabled="isSubmitting" class="ui-btn ui-btn-primary">
          {{
            isUploading
              ? "Subiendo la foto..."
              : isSubmitting
                ? "Guardando..."
                : isEditMode
                  ? "Guardar cambios"
                  : "Abrir el cuarto"
          }}
        </button>
      </form>

      <aside class="lg:col-span-5">
        <p class="mb-4 text-sm font-semibold text-[var(--l-muted)]">Así se verá en la casa</p>
        <div class="mx-auto max-w-xs rotate-2 lg:sticky lg:top-24">
          <CategoryCard :category="preview" />
        </div>
      </aside>
    </div>
  </section>
</template>
