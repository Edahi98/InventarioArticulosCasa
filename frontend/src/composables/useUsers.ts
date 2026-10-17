import { onMounted, ref } from "vue";
import type { SystemUser } from "../core/domain/user.js";
import { listUsersUseCase } from "../core/usecases/listUsers.js";

/**
 * Lista de habitantes (usuarios del sistema): la carga al montar y permite agregar, reemplazar o quitar uno
 * sin volver a pedirlos.
 *
 * @returns `usersList`, `isLoading` y `errorMessage` para la plantilla, y las acciones `load`, `upsert` y `remove`.
 */
export function useUsers() {
  const usersList = ref<SystemUser[]>([]);
  const isLoading = ref(true);
  const errorMessage = ref("");

  async function load(): Promise<void> {
    isLoading.value = true;
    try {
      usersList.value = await listUsersUseCase.execute();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "Error al cargar los usuarios.";
    } finally {
      isLoading.value = false;
    }
  }

  function upsert(saved: SystemUser): void {
    const exists = usersList.value.some((user) => user.id === saved.id);
    usersList.value = exists ? usersList.value.map((user) => (user.id === saved.id ? saved : user)) : [...usersList.value, saved];
  }

  function remove(id: number): void {
    usersList.value = usersList.value.filter((user) => user.id !== id);
  }

  onMounted(load);

  return { usersList, isLoading, errorMessage, load, upsert, remove };
}
