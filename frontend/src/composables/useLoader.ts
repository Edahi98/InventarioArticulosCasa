import { onMounted, ref, type Ref } from "vue";

/**
 * Carga un dato al montar el componente y lleva el estado de la carga.
 *
 * @param load - Función que obtiene el dato (por ejemplo, la llamada a un caso de uso).
 * @param fallback - Mensaje a mostrar si el error no trae uno.
 * @returns `data` (el dato, o `null` mientras carga o si falló), `isLoading` y `errorMessage` para la plantilla.
 */
export function useLoader<T>(load: () => Promise<T>, fallback: string) {
  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref(true);
  const errorMessage = ref("");

  onMounted(async () => {
    try {
      data.value = await load();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : fallback;
    } finally {
      isLoading.value = false;
    }
  });

  return { data, isLoading, errorMessage };
}
