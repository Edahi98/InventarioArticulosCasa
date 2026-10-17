import { onBeforeUnmount, ref } from "vue";
import type { LoginMood } from "../infrastructure/three/LoginStage.js";

/**
 * Estado de ánimo de los ositos que puede volver solo a otro estado pasado un tiempo.
 *
 * @param initial - Estado inicial.
 * @returns `mood` para enlazarlo a la escena y `setMood` para cambiarlo.
 */
export function useTimedMood(initial: LoginMood = "idle") {
  const mood = ref<LoginMood>(initial);
  let timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Cambia el estado de ánimo y, si se indica un retraso, ejecuta `after` cuando termine.
   *
   * @param next - Nuevo estado de ánimo.
   * @param after - Qué hacer al pasar el retraso (por ejemplo, volver a `idle` o cambiar de página).
   * @param delay - Milisegundos de espera; con 0 no se programa nada.
   */
  function setMood(next: LoginMood, after: () => void = () => undefined, delay = 0): void {
    clearTimeout(timer);
    mood.value = next;
    if (delay === 0) return;
    timer = setTimeout(after, delay);
  }

  onBeforeUnmount(() => clearTimeout(timer));

  return { mood, setMood };
}
