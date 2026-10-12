import { z } from "zod";
import { requiredString, safeText } from "./commonValidators.js";
import { LIMITS, USERNAME_PATTERN } from "./injectionPatterns.js";

const usernameSchema = safeText(LIMITS.username, USERNAME_PATTERN, 1);

const newPasswordSchema = requiredString()
  .trim()
  .min(LIMITS.passwordMin, `debe tener al menos ${LIMITS.passwordMin} caracteres`)
  .max(LIMITS.passwordMax, `no puede superar ${LIMITS.passwordMax} caracteres`);

export const loginForm = z.object({
  username: usernameSchema,
  password: requiredString().trim().min(1, "es obligatoria").max(LIMITS.passwordMax, "es demasiado larga"),
});

export const userCreateForm = z.object({
  username: usernameSchema,
  password: newPasswordSchema,
});

export const userUpdateForm = z.object({
  username: usernameSchema,
  password: z
    .union([z.literal(""), newPasswordSchema])
    .transform((value) => value || undefined),
});

export type LoginFormInput = z.output<typeof loginForm>;
export type UserCreateFormInput = z.output<typeof userCreateForm>;
export type UserUpdateFormInput = z.output<typeof userUpdateForm>;
