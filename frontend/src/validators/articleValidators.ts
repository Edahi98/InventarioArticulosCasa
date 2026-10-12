import { z } from "zod";
import { descriptionSchema, idSchema, nameSchema, stockSchema } from "./commonValidators.js";

export const articleForm = z.object({
  name: nameSchema,
  description: descriptionSchema,
  categoryId: idSchema,
  stock: stockSchema,
  needsRepair: z.boolean({ error: "debe ser verdadero o falso" }),
});

export type ArticleFormInput = z.output<typeof articleForm>;
