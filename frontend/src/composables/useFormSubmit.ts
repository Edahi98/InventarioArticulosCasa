import { ref } from "vue";
import type { ZodType, output } from "zod";
import { validateInput } from "../validators/validateInput.js";

/**
 * Estado y pasos comunes de un formulario: validar con zod, mostrar los errores por campo y enviar
 * mostrando el mensaje de error si algo falla.
 *
 * @returns `isSubmitting`, `errorMessage` y `fieldErrors` para la plantilla, `validate` para revisar los
 * datos, `submit` para ejecutar el envío, `fail` para mostrar un mensaje propio y `reset` para limpiar.
 */
export function useFormSubmit() {
  const isSubmitting = ref(false);
  const errorMessage = ref("");
  const fieldErrors = ref<Record<string, string>>({});

  function reset(): void {
    errorMessage.value = "";
    fieldErrors.value = {};
  }

  function fail(message: string): void {
    errorMessage.value = message;
  }

  /**
   * Valida un valor con un esquema de zod, limpiando antes los errores anteriores.
   *
   * @param schema - Esquema de zod.
   * @param input - Datos a validar (normalmente el estado del formulario).
   * @param labels - Nombre legible de cada campo; si se indica, el mensaje general nombra el primer campo
   * con error (por ejemplo, «La lista necesita al menos una cosa.»).
   * @returns Los datos ya normalizados, o `null` si no son válidos (los errores quedan en `fieldErrors` y `errorMessage`).
   */
  function validate<S extends ZodType>(schema: S, input: unknown, labels?: Record<string, string>): output<S> | null {
    reset();
    const checked = validateInput(schema, input);
    if (checked.ok) return checked.data;

    fieldErrors.value = checked.failure.fields;
    const [field, message] = Object.entries(checked.failure.fields)[0] ?? ["", "no es válido"];
    errorMessage.value = labels ? `${labels[field.split(".")[0] ?? ""] ?? "Lo que escribiste"} ${message}.` : checked.failure.message;
    return null;
  }

  /**
   * Ejecuta el envío marcando `isSubmitting`; si falla, muestra el mensaje del error o el indicado.
   *
   * @param task - Operación que envía los datos.
   * @param fallback - Mensaje a mostrar cuando el error no trae uno.
   * @returns `true` si el envío terminó bien, `false` si falló.
   */
  async function submit(task: () => Promise<void>, fallback: string): Promise<boolean> {
    isSubmitting.value = true;
    try {
      await task();
      return true;
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : fallback;
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  return { isSubmitting, errorMessage, fieldErrors, validate, submit, fail, reset };
}

export type FormFeedback = ReturnType<typeof useFormSubmit>;
