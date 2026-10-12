import { z } from "zod";
import { descriptionSchema, titleSchema } from "./commonValidators.js";

export const noteForm = z.object({
  title: titleSchema,
  description: descriptionSchema,
});

export type NoteFormInput = z.output<typeof noteForm>;
