import { z } from "zod";
import { MAX_URL_LENGTH } from "../constantes/scrape_constantes.js";

/**
 * Esquema del cuerpo de `POST /scrape`: una URL `http` o `https` de hasta 2048 caracteres.
 */
export const scrapeBody = z.object({
  url: z
    .string()
    .trim()
    .max(MAX_URL_LENGTH)
    .refine((value) => {
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "debe ser una URL http o https válida"),
});

export type ScrapeBody = z.infer<typeof scrapeBody>;
