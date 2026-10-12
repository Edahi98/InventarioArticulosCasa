import { z } from "zod";
import {
  descriptionSchema,
  hasImageSignature,
  idSchema,
  imageUrlSchema,
  nameSchema,
  stockSchema,
} from "./commonValidators.js";
import { FILENAME_PATTERN, IMAGE_MIME_TYPES, LIMITS } from "./injectionPatterns.js";

export const articleIdParams = z.object({ id: idSchema });

export const articleListQuery = z.object({ categoryId: idSchema.optional() });

export const articleBody = z.object({
  name: nameSchema,
  description: descriptionSchema,
  imageUrl: imageUrlSchema,
  categoryId: idSchema,
  stock: stockSchema,
  needsRepair: z.boolean({ error: "debe ser verdadero o falso" }).default(false),
});

export const articleNotesParams = z.object({ articleId: idSchema });

export const imageFile = z
  .object({
    originalname: z.string().regex(FILENAME_PATTERN, "el nombre del archivo no es válido"),
    mimetype: z.enum(IMAGE_MIME_TYPES, { error: "debe ser una imagen JPEG, PNG, WEBP o GIF" }),
    size: z.number().int().positive().max(LIMITS.imageBytes, "supera el tamaño máximo de 4 MB"),
    buffer: z.instanceof(Buffer).refine(hasImageSignature, "el archivo no es una imagen válida"),
  })
  .strip();

export type ArticleBody = z.infer<typeof articleBody>;
