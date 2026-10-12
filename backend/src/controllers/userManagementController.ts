import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, type User } from "../db/schema/users.js";
import { validationService } from "../services/validationService.js";
import { sessionService } from "../services/sessionService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";

const PASSWORD_SALT_ROUNDS = 12;

/**
 * Quita el hash de la contraseña de un usuario antes de enviarlo al cliente.
 *
 * @param user - Usuario de la base de datos.
 * @returns Id, nombre de usuario y fecha de creación.
 */
function toSafeUser(user: User): { id: number; username: string; createdAt: string } {
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

/**
 * Verifica que ningún otro usuario tenga el mismo nombre.
 *
 * @param username - Nombre de usuario a comprobar.
 * @param excludeId - Usuario que se ignora (el que se está editando).
 * @throws AppError 409 si ya existe.
 */
async function ensureUsernameIsUnique(username: string, excludeId?: number): Promise<void> {
  const [existing] = await db.select().from(users).where(eq(users.username, username));
  if (existing && existing.id !== excludeId) {
    throw new AppError(`El usuario "${username}" ya existe.`, 409);
  }
}

/**
 * GET /users — lista los usuarios sin sus contraseñas.
 */
export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const allUsers = await db.select().from(users);
  res.status(200).json(allUsers.map(toSafeUser));
});

/**
 * POST /users — crea un usuario con contraseña cifrada (bcrypt).
 *
 * Responde 201 con el usuario creado.
 * @throws AppError 400 si faltan campos, 409 si el usuario ya existe.
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  const validatedUsername = validationService.requireNonEmptyString(username, "username");
  const validatedPassword = validationService.requireNonEmptyString(password, "password");

  await ensureUsernameIsUnique(validatedUsername);

  const passwordHash = await bcrypt.hash(validatedPassword, PASSWORD_SALT_ROUNDS);
  const [created] = await db
    .insert(users)
    .values({ username: validatedUsername, passwordHash })
    .returning();

  res.status(201).json(toSafeUser(created));
});

/**
 * PUT /users/:id — actualiza el nombre y, si se envía, la contraseña de un usuario.
 * Cambiar la contraseña cierra todas las sesiones del usuario.
 *
 * @throws AppError 400 si falta el nombre, 404 si no existe, 409 si el nombre ya existe.
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { username, password } = req.body ?? {};
  const validatedUsername = validationService.requireNonEmptyString(username, "username");

  const [existingUser] = await db.select().from(users).where(eq(users.id, id));
  if (!existingUser) {
    throw new AppError(`El usuario con id ${id} no existe.`, 404);
  }

  await ensureUsernameIsUnique(validatedUsername, id);

  const updateValues: { username: string; passwordHash?: string } = {
    username: validatedUsername,
  };

  if (typeof password === "string" && password.trim()) {
    updateValues.passwordHash = await bcrypt.hash(password.trim(), PASSWORD_SALT_ROUNDS);
  }

  const [updated] = await db.update(users).set(updateValues).where(eq(users.id, id)).returning();
  if (updateValues.passwordHash) {
    await sessionService.revokeAllForUser(id);
  }
  res.status(200).json(toSafeUser(updated));
});

/**
 * DELETE /users/:id — elimina un usuario.
 *
 * Responde 204 al eliminar.
 * @throws AppError 404 si no existe.
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const [existingUser] = await db.select().from(users).where(eq(users.id, id));
  if (!existingUser) {
    throw new AppError(`El usuario con id ${id} no existe.`, 404);
  }

  await db.delete(users).where(eq(users.id, id));
  res.status(204).send();
});
