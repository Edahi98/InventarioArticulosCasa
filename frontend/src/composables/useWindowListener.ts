import { onBeforeUnmount, onMounted } from "vue";

/**
 * Registra un escuchador en `window` cuando el componente se monta y lo quita cuando se desmonta.
 *
 * @param type - Evento a escuchar (por ejemplo, `keydown` o `pointermove`).
 * @param handler - Función que recibe el evento.
 * @param options - Opciones del escuchador (por ejemplo, `{ passive: true }`).
 */
export function useWindowListener<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void {
  onMounted(() => window.addEventListener(type, handler, options));
  onBeforeUnmount(() => window.removeEventListener(type, handler, options));
}
