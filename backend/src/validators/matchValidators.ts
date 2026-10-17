import { z } from "zod";
import { MAX_TERM_LENGTH, MAX_TERMS } from "../constantes/match_constantes.js";

/**
 * Esquema del cuerpo de `POST /match`: de 1 a 100 textos no vacíos de hasta 200 caracteres.
 */
export const matchBody = z.object({
  terms: z.array(z.string().trim().min(1).max(MAX_TERM_LENGTH)).min(1).max(MAX_TERMS),
});

export type MatchBody = z.infer<typeof matchBody>;
