import { z } from "zod";
import { descriptionSchema, idSchema, titleSchema } from "./commonValidators.js";

export const noteIdParams = z.object({ id: idSchema });

export const noteListQuery = z.object({ articleId: idSchema.optional() });

export const noteCreateBody = z.object({
  title: titleSchema,
  description: descriptionSchema,
  articleId: idSchema,
});

export const noteUpdateBody = z.object({
  title: titleSchema,
  description: descriptionSchema,
});

export type NoteCreateBody = z.infer<typeof noteCreateBody>;
export type NoteUpdateBody = z.infer<typeof noteUpdateBody>;
