import { onMounted, ref } from "vue";
import type { Category } from "../core/domain/category.js";
import { countArticlesByCategoryUseCase } from "../core/usecases/countArticlesByCategory.js";
import { listCategoriesUseCase } from "../core/usecases/listCategories.js";

/**
 * Las categorías («cuartos») con cuántos artículos guarda cada una: las carga al montar y permite reemplazar o
 * quitar una sin volver a pedirlas.
 *
 * @returns `categories`, `counts` (artículos por identificador de categoría), `isLoading` y `errorMessage` para la
 * plantilla, y las acciones `replace` y `remove`.
 */
export function useCategoriesOverview() {
  const categories = ref<Category[]>([]);
  const counts = ref<Record<number, number>>({});
  const isLoading = ref(true);
  const errorMessage = ref("");

  async function load(): Promise<void> {
    try {
      const [list, report] = await Promise.all([listCategoriesUseCase.execute(), countArticlesByCategoryUseCase.execute()]);
      categories.value = list;
      counts.value = Object.fromEntries(report.categories.map((entry) => [entry.categoryId, entry.total]));
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "Error al cargar las categorías.";
    } finally {
      isLoading.value = false;
    }
  }

  function replace(updated: Category): void {
    categories.value = categories.value.map((category) => (category.id === updated.id ? updated : category));
  }

  function remove(id: number): void {
    categories.value = categories.value.filter((category) => category.id !== id);
  }

  onMounted(load);

  return { categories, counts, isLoading, errorMessage, replace, remove };
}
