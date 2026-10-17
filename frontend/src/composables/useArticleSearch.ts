import { onBeforeUnmount, ref, watch } from "vue";
import { SEARCH_DEBOUNCE_MS } from "../constantes/ui_constantes.js";
import { searchArticles, type SearchResult } from "../infrastructure/httpSearchRepository.js";
import { searchForm } from "../validators/searchValidators.js";
import { validateInput } from "../validators/validateInput.js";

/**
 * Búsqueda de artículos mientras se escribe: valida el texto, espera 300 ms sin teclear y consulta al servidor.
 *
 * @returns `query` (texto a enlazar con el campo), `results`, `isLoading`, `searched` (ya se consultó al menos
 * una vez con este texto) y `queryError` (mensaje si el texto no es válido).
 */
export function useArticleSearch() {
  const query = ref("");
  const results = ref<SearchResult[]>([]);
  const isLoading = ref(false);
  const searched = ref(false);
  const queryError = ref("");

  let timer: ReturnType<typeof setTimeout> | undefined;

  async function run(text: string): Promise<void> {
    isLoading.value = true;
    searched.value = true;
    try {
      results.value = await searchArticles(text);
    } finally {
      isLoading.value = false;
    }
  }

  function clear(): void {
    results.value = [];
    searched.value = false;
  }

  watch(query, (value) => {
    clearTimeout(timer);
    queryError.value = "";
    if (!value.trim()) {
      clear();
      return;
    }

    const checked = validateInput(searchForm, { q: value });
    if (!checked.ok) {
      queryError.value = `La búsqueda ${checked.failure.fields.q ?? "no es válida"}.`;
      clear();
      return;
    }
    timer = setTimeout(() => void run(checked.data.q), SEARCH_DEBOUNCE_MS);
  });

  onBeforeUnmount(() => clearTimeout(timer));

  return { query, results, isLoading, searched, queryError };
}
