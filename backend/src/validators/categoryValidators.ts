import { z } from "zod";
import { descriptionSchema, idSchema, imageUrlSchema, nameSchema } from "./commonValidators.js";

export const categoryIdParams = z.object({ id: idSchema });

export const categoryBody = z.object({
  name: nameSchema,
  description: descriptionSchema,
  imageUrl: imageUrlSchema,
});

export type CategoryBody = z.infer<typeof categoryBody>;
