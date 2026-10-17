import { z } from "zod";
import { descriptionSchema, locationSchema, nameSchema } from "./commonValidators.js";

export const categoryForm = z.object({
  name: nameSchema,
  description: descriptionSchema,
  location: locationSchema,
});

export type CategoryFormInput = z.output<typeof categoryForm>;
