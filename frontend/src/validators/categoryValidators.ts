import { z } from "zod";
import { descriptionSchema, nameSchema } from "./commonValidators.js";

export const categoryForm = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export type CategoryFormInput = z.output<typeof categoryForm>;
