import { computed, ref } from "vue";

const NIGHT_STARTS = 19;
const DAY_STARTS = 6;

/**
 * Reloj del barrio: la hora que muestra el escenario y si la persona la movió a mano o sigue la real.
 *
 * @param applyHour - Aplica una hora al escenario; recibe `null` para volver a seguir el reloj real.
 * @returns `hour` (se actualiza desde el escenario), `manualHour`, `clock` (hora legible), `isNight`, y los
 * manejadores `scrub` (evento `input` del control deslizante) y `followClock` (botón «Ahora»).
 */
export function useDayClock(applyHour: (hour: number | null) => void) {
  const hour = ref(12);
  const manualHour = ref(false);

  const clock = computed(() => {
    const moment = new Date();
    moment.setHours(Math.floor(hour.value), Math.round((hour.value % 1) * 60), 0, 0);
    return moment.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  });
  const isNight = computed(() => hour.value < DAY_STARTS || hour.value >= NIGHT_STARTS);

  function scrub(event: Event): void {
    manualHour.value = true;
    applyHour(Number((event.target as HTMLInputElement).value));
  }

  function followClock(): void {
    manualHour.value = false;
    applyHour(null);
  }

  return { hour, manualHour, clock, isNight, scrub, followClock };
}
