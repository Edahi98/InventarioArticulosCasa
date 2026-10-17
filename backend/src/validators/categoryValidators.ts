import { z } from "zod";
import { descriptionSchema, idSchema, imageUrlSchema, locationSchema, nameSchema } from "./commonValidators.js";

export const categoryIdParams = z.object({ id: idSchema });

export const categoryBody = z.object({
  name: nameSchema,
  description: descriptionSchema,
  imageUrl: imageUrlSchema,
  location: locationSchema,
});

export type CategoryBody = z.infer<typeof categoryBody>;
