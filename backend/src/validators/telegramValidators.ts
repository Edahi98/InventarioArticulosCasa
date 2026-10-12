import { z } from "zod";
import { requiredString } from "./commonValidators.js";

export const claimBody = z.object({
  code: requiredString()
    .trim()
    .regex(/^[A-Za-z0-9 -]{6,20}$/, "no tiene el formato de un código de vinculación"),
});

export type ClaimBody = z.infer<typeof claimBody>;
