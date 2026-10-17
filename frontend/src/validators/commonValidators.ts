import { z } from "zod";
import {
  LIMITS,
  NAME_PATTERN,
  SCRIPT_PATTERNS,
  SQL_PATTERNS,
  TEXT_PATTERN,
} from "./injectionPatterns.js";

z.config(z.locales.es());

const INJECTION_MESSAGE = "contiene código no permitido (HTML, script o SQL)";
const CHARACTERS_MESSAGE = "tiene caracteres que no se permiten";

/**
 * Indica si un texto contiene un patrón de script (HTML/JavaScript) o de SQL.
 *
 * @param text - Texto escrito por la persona.
 * @returns `true` si coincide con algún patrón bloqueado.
 */
export function containsInjection(text: string): boolean {
  const normalized = text.normalize("NFKC");
  return [...SCRIPT_PATTERNS, ...SQL_PATTERNS].some((pattern) => pattern.test(normalized));
}

/**
 * Esquema de texto con mensajes en español cuando el campo falta o no es un texto.
 *
 * @returns Esquema base de string.
 */
export function requiredString() {
  return z.string({
    error: (issue) => (issue.input === undefined ? "es obligatorio" : "debe ser texto"),
  });
}

/**
 * Construye un esquema de texto: normaliza (NFKC) y recorta, valida largo y patrón de caracteres,
 * y rechaza scripts y SQL.
 *
 * @param max - Largo máximo.
 * @param pattern - Expresión regular que debe cumplir el texto.
 * @param min - Largo mínimo (0 permite vacío).
 * @returns Esquema de zod que produce el texto ya normalizado.
 */
export function safeText(max: number, pattern: RegExp, min = 0) {
  return requiredString()
    .transform((value) => value.normalize("NFKC").trim())
    .pipe(
      z
        .string()
        .min(min, "es obligatorio")
        .max(max, `no puede superar ${max} caracteres`)
        .regex(pattern, CHARACTERS_MESSAGE)
        .refine((value) => !containsInjection(value), INJECTION_MESSAGE),
    );
}

export const idSchema = z.coerce
  .number({ error: "elige una opción" })
  .int("elige una opción")
  .positive("elige una opción");

export const nameSchema = safeText(LIMITS.name, NAME_PATTERN, 1);
export const titleSchema = safeText(LIMITS.title, TEXT_PATTERN, 1);
export const descriptionSchema = safeText(LIMITS.text, TEXT_PATTERN);
export const locationSchema = safeText(LIMITS.name, TEXT_PATTERN);
export const searchTextSchema = safeText(LIMITS.query, TEXT_PATTERN);

export const stockSchema = z.coerce
  .number({ error: "debe ser un número entero" })
  .int("debe ser un número entero")
  .min(0, "no puede ser negativo")
  .max(LIMITS.stock, `no puede superar ${LIMITS.stock}`);
