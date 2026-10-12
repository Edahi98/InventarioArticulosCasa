import { z } from "zod";
import { idSchema, requiredString, safeText } from "./commonValidators.js";
import { LIMITS, USERNAME_PATTERN } from "./injectionPatterns.js";

const usernameSchema = safeText(LIMITS.username, USERNAME_PATTERN, 1);

const newPasswordSchema = requiredString()
  .trim()
  .min(LIMITS.passwordMin, `debe tener al menos ${LIMITS.passwordMin} caracteres`)
  .max(LIMITS.passwordMax, `no puede superar ${LIMITS.passwordMax} caracteres`);

export const userIdParams = z.object({ id: idSchema });

export const loginBody = z.object({
  username: usernameSchema,
  password: requiredString().trim().min(1, "es obligatorio").max(LIMITS.passwordMax, "es demasiado largo"),
});

export const userCreateBody = z.object({
  username: usernameSchema,
  password: newPasswordSchema,
});

export const userUpdateBody = z.object({
  username: usernameSchema,
  password: z
    .union([z.literal(""), newPasswordSchema])
    .optional()
    .transform((value) => value || undefined),
});

export type LoginBody = z.infer<typeof loginBody>;
export type UserCreateBody = z.infer<typeof userCreateBody>;
export type UserUpdateBody = z.infer<typeof userUpdateBody>;
