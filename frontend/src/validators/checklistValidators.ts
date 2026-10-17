import { z } from "zod";
import { MAX_LINE_LENGTH, MAX_LINES, MAX_PAGE_URL_LENGTH } from "../constantes/checklist_constantes.js";
import { locationSchema, requiredString, safeText } from "./commonValidators.js";
import { TEXT_PATTERN } from "./injectionPatterns.js";

export const checklistForm = z.object({
  title: locationSchema,
  lines: z
    .array(safeText(MAX_LINE_LENGTH, TEXT_PATTERN, 1))
    .min(1, "necesita al menos una cosa")
    .max(MAX_LINES, `no puede tener más de ${MAX_LINES} cosas`),
});

export const pageForm = z.object({
  url: requiredString()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "es obligatoria")
        .max(MAX_PAGE_URL_LENGTH, `no puede superar ${MAX_PAGE_URL_LENGTH} caracteres`)
        .refine((value) => {
          try {
            return ["http:", "https:"].includes(new URL(value).protocol);
          } catch {
            return false;
          }
        }, "debe empezar con http:// o https://"),
    ),
});

export type ChecklistFormInput = z.output<typeof checklistForm>;
export type PageFormInput = z.output<typeof pageForm>;
