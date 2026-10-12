import type { ZodType, output } from "zod";

export interface ValidationFailure {
  fields: Record<string, string>;
  message: string;
}

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; failure: ValidationFailure };

const SUMMARY_MESSAGE = "Revisa los campos marcados.";

/**
 * Valida un valor con un esquema de zod y lo devuelve normalizado, o los errores por campo.
 *
 * @param schema - Esquema de zod.
 * @param input - Valor a validar (normalmente el estado de un formulario).
 * @returns `{ ok: true, data }` con el valor ya recortado y convertido, o `{ ok: false, failure }` con
 * el mensaje de cada campo (el primero que falle) y un mensaje general.
 */
export function validateInput<S extends ZodType>(schema: S, input: unknown): ValidationResult<output<S>> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "form";
    fields[field] ??= issue.message;
  }
  return { ok: false, failure: { fields, message: SUMMARY_MESSAGE } };
}
