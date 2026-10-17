import { computed, ref, type Ref } from "vue";
import type { SourceList } from "../core/domain/checklist.js";
import { scrapeRecipeUseCase } from "../core/usecases/scrapeRecipe.js";
import { CHECKLIST_FIELD_LABELS } from "../constantes/checklist_constantes.js";
import { pageForm } from "../validators/checklistValidators.js";
import type { FormFeedback } from "./useFormSubmit.js";

interface RecipeImportOptions {
  feedback: FormFeedback;
  title: Ref<string>;
  text: Ref<string>;
}

/**
 * Trae las cosas de una lista desde una página web: lee la página, deja elegir una de las fuentes
 * encontradas (listas, tablas o, si no hay, encabezados y párrafos) y la vuelca en el texto del formulario.
 *
 * @param options - `feedback` para mostrar errores, `title` (se rellena con el nombre de la página si estaba
 * vacío) y `text` (recibe la fuente elegida, una cosa por renglón).
 * @returns `pageUrl`, `pageLists`, `pickedList`, `isFetching` y `usedFallback` para la plantilla, y las
 * acciones `fetchPage` y `pickList`.
 */
export function useRecipeImport({ feedback, title, text }: RecipeImportOptions) {
  const pageUrl = ref("");
  const pageLists = ref<SourceList[]>([]);
  const pickedList = ref<number | null>(null);
  const isFetching = ref(false);

  const usedFallback = computed(
    () => pageLists.value.length > 0 && pageLists.value.every((list) => list.source === "encabezados" || list.source === "parrafos"),
  );

  function pickList(index: number): void {
    const list = pageLists.value[index];
    if (!list) return;
    pickedList.value = index;
    text.value = list.items.join("\n");
  }

  async function fetchPage(): Promise<void> {
    const data = feedback.validate(pageForm, { url: pageUrl.value }, CHECKLIST_FIELD_LABELS);
    if (!data) return;

    isFetching.value = true;
    pageLists.value = [];
    pickedList.value = null;
    try {
      const page = await scrapeRecipeUseCase.execute(data.url);
      if (page.lists.length === 0) {
        feedback.fail("Los guardianes no encontraron nada que sirva como lista en esa página.");
        return;
      }
      pageLists.value = page.lists;
      if (!title.value.trim()) title.value = page.planName;
      pickList(0);
    } catch (error) {
      feedback.fail(error instanceof Error ? error.message : "No se pudo leer la página.");
    } finally {
      isFetching.value = false;
    }
  }

  return { pageUrl, pageLists, pickedList, isFetching, usedFallback, fetchPage, pickList };
}
