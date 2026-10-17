import { onMounted, ref } from "vue";
import type { Note } from "../core/domain/note.js";
import { listNotesByArticleUseCase } from "../core/usecases/listNotesByArticle.js";

/**
 * Lista de notas de un artículo: la carga al montar y permite reemplazar o quitar una sin volver a pedirlas.
 *
 * @param articleId - Devuelve el identificador del artículo.
 * @returns `notes`, `isLoading` y `loadError` para la plantilla, y las acciones `load`, `replace` y `remove`.
 */
export function useNotes(articleId: () => number) {
  const notes = ref<Note[]>([]);
  const isLoading = ref(true);
  const loadError = ref("");

  async function load(): Promise<void> {
    isLoading.value = true;
    try {
      notes.value = await listNotesByArticleUseCase.execute(articleId());
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : "Error al cargar las notas.";
    } finally {
      isLoading.value = false;
    }
  }

  function replace(updated: Note): void {
    notes.value = notes.value.map((note) => (note.id === updated.id ? updated : note));
  }

  function remove(id: number): void {
    notes.value = notes.value.filter((note) => note.id !== id);
  }

  onMounted(load);

  return { notes, isLoading, loadError, load, replace, remove };
}
