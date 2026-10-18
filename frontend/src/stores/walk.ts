import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface DoorPrompt {
  id: number;
  name: string;
}

export const useWalkStore = defineStore("walk", () => {
  const walking = ref(false);
  const loading = ref(false);
  const locked = ref(false);
  const prompt = ref<DoorPrompt | null>(null);
  const entering = ref(false);
  const lastHouseId = ref<number | null>(null);
  const resumeAtDoor = ref(false);
  const touch = ref(false);

  const canInteract = computed(() => walking.value && prompt.value !== null && !entering.value);

  /**
   * Marca que se pidió caminar; mientras carga la física se muestra el aviso.
   */
  function begin(): void {
    walking.value = true;
    loading.value = true;
  }

  /**
   * Avisa que la física y los controles ya están listos.
   */
  function ready(): void {
    loading.value = false;
  }

  /**
   * Deja de caminar y olvida la puerta, el aviso y la captura del puntero.
   */
  function end(): void {
    walking.value = false;
    loading.value = false;
    locked.value = false;
    prompt.value = null;
    entering.value = false;
    resumeAtDoor.value = false;
  }

  /**
   * Registra que se entró a una casa: al volver del cuarto se reanuda el paseo en su puerta.
   *
   * @param id - Identificador de la categoría cuya puerta se cruzó.
   */
  function enterHouse(id: number): void {
    lastHouseId.value = id;
    entering.value = true;
    prompt.value = null;
    resumeAtDoor.value = true;
  }

  /**
   * Consume la bandera de reanudar: devuelve la casa por cuya puerta se salió, una sola vez.
   *
   * @returns El identificador de la casa, o `null` si no hay que reanudar.
   */
  function takeResume(): number | null {
    if (!walking.value || !resumeAtDoor.value) return null;
    resumeAtDoor.value = false;
    entering.value = false;
    return lastHouseId.value;
  }

  return { walking, loading, locked, prompt, entering, lastHouseId, resumeAtDoor, touch, canInteract, begin, ready, end, enterHouse, takeResume };
});
