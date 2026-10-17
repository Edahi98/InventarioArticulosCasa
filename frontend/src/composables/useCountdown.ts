import { computed, onBeforeUnmount, ref } from "vue";
import { COUNTDOWN_TICK_MS } from "../constantes/ui_constantes.js";

/**
 * Cuenta regresiva hasta una fecha de vencimiento, actualizada cada segundo.
 *
 * @param expiresAt - Devuelve la fecha de vencimiento en formato ISO, o `null` si aún no hay una.
 * @returns `remainingSeconds`, `isExpired` y `countdown` (`m:ss`) para la plantilla, y `start` para
 * empezar a contar cuando llega un vencimiento nuevo.
 */
export function useCountdown(expiresAt: () => string | null) {
  const now = ref(Date.now());
  let ticker: ReturnType<typeof setInterval> | undefined;

  const remainingSeconds = computed(() => {
    const target = expiresAt();
    return target ? Math.max(0, Math.floor((new Date(target).getTime() - now.value) / 1000)) : 0;
  });
  const isExpired = computed(() => expiresAt() !== null && remainingSeconds.value === 0);
  const countdown = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60);
    const seconds = String(remainingSeconds.value % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  });

  function start(): void {
    now.value = Date.now();
    clearInterval(ticker);
    ticker = setInterval(() => {
      now.value = Date.now();
    }, COUNTDOWN_TICK_MS);
  }

  onBeforeUnmount(() => clearInterval(ticker));

  return { remainingSeconds, isExpired, countdown, start };
}
