import { onBeforeUnmount, ref } from "vue";
import { COPIED_FEEDBACK_MS } from "../constantes/ui_constantes.js";

/**
 * Copia texto al portapapeles y mantiene un aviso de «copiado» que se apaga solo.
 *
 * @param resetMs - Tiempo en milisegundos que dura el aviso.
 * @returns `copied` para la plantilla, `copy` para copiar un texto y `reset` para apagar el aviso.
 */
export function useClipboard(resetMs = COPIED_FEEDBACK_MS) {
  const copied = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function reset(): void {
    clearTimeout(timer);
    copied.value = false;
  }

  /**
   * Copia un texto al portapapeles.
   *
   * @param text - Texto a copiar.
   * @returns `true` si se copió, `false` si el navegador lo impidió.
   */
  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return false;
    }
    copied.value = true;
    clearTimeout(timer);
    timer = setTimeout(reset, resetMs);
    return true;
  }

  onBeforeUnmount(() => clearTimeout(timer));

  return { copied, copy, reset };
}
