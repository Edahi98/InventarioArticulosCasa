import { computed, nextTick, ref, watch, type Ref } from "vue";
import type { ChecklistEntry, ChecklistItem, ChecklistStatus } from "../core/domain/checklist.js";
import { reviewChecklistUseCase } from "../core/usecases/reviewChecklist.js";
import { CHECKLIST_FIELD_LABELS } from "../constantes/checklist_constantes.js";
import { checklistForm } from "../validators/checklistValidators.js";
import { useClipboard } from "./useClipboard.js";
import type { FormFeedback } from "./useFormSubmit.js";

interface ChecklistOptions {
  feedback: FormFeedback;
  title: Ref<string>;
  lines: Readonly<Ref<string[]>>;
}

/**
 * Revisión de una lista contra el inventario: pide las coincidencias, clasifica cada cosa, permite cambiar
 * la elegida, abrir la etiqueta de una cosa y copiar lo que falta.
 *
 * @param options - `feedback` para mostrar errores y el estado de envío, `title` (nombre del plan) y `lines`
 * (las cosas, una por renglón, ya limpias).
 * @returns El estado para la plantilla (`hasReviewed`, `isReviewing`, `copied`, `celebrations`, `selected`,
 * `summary`, `statuses`, `have`, `toCheck`, `missing`, `selectedEntry`), la referencia `results` del bloque
 * de resultados y las acciones `review`, `choose`, `toggleSelect` y `copyPending`.
 */
export function useChecklist({ feedback, title, lines }: ChecklistOptions) {
  const items = ref<ChecklistItem[]>([]);
  const hasReviewed = ref(false);
  const selected = ref<number | null>(null);
  const celebrations = ref(0);
  const results = ref<HTMLElement | null>(null);
  const { copied, copy, reset: resetCopied } = useClipboard();

  const summary = computed(() => reviewChecklistUseCase.summarize(items.value));
  const statuses = computed(() => items.value.map((item) => reviewChecklistUseCase.classify(item)));
  const entries = computed<ChecklistEntry[]>(() =>
    items.value.map((item, index) => ({ item, index, match: reviewChecklistUseCase.chosen(item), status: statuses.value[index] as ChecklistStatus })),
  );
  const have = computed(() => entries.value.filter((entry) => entry.status === "tengo"));
  const toCheck = computed(() => entries.value.filter((entry) => entry.status === "revisar"));
  const missing = computed(() => entries.value.filter((entry) => entry.status === "falta"));
  const selectedEntry = computed(() => entries.value.find((entry) => entry.index === selected.value) ?? null);

  watch(
    () => summary.value.complete,
    (now, before) => {
      if (now && !before && hasReviewed.value) celebrations.value += 1;
    },
  );

  async function review(): Promise<void> {
    resetCopied();
    const data = feedback.validate(checklistForm, { title: title.value, lines: lines.value }, CHECKLIST_FIELD_LABELS);
    if (!data) return;

    await feedback.submit(async () => {
      items.value = await reviewChecklistUseCase.execute(data.lines);
      selected.value = null;
      hasReviewed.value = true;
      if (summary.value.complete) celebrations.value += 1;
      await nextTick();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      results.value?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, "No se pudo revisar la lista.");
  }

  function choose(index: number, choice: number | null): void {
    items.value = items.value.map((item, position) => (position === index ? { ...item, choice } : item));
  }

  function toggleSelect(index: number): void {
    selected.value = selected.value === index ? null : index;
  }

  async function copyPending(): Promise<void> {
    const copiedOk = await copy(reviewChecklistUseCase.shoppingList(items.value, title.value.trim()));
    if (!copiedOk) feedback.fail("No se pudo copiar la lista. Cópiala a mano desde abajo.");
  }

  return {
    hasReviewed,
    isReviewing: feedback.isSubmitting,
    copied,
    celebrations,
    results,
    selected,
    summary,
    statuses,
    have,
    toCheck,
    missing,
    selectedEntry,
    review,
    choose,
    toggleSelect,
    copyPending,
  };
}
