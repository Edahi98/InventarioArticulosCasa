import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, type User } from "../db/schema/users.js";
import { validationService } from "../services/validationService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";

const PASSWORD_SALT_ROUNDS = 12;

function toSafeUser(user: User): { id: number; username: string; createdAt: string } {
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

async function ensureUsernameIsUnique(username: string, excludeId?: number): Promise<void> {
  const [existing] = await db.select().from(users).where(eq(users.username, username));
  if (existing && existing.id !== excludeId) {
    throw new AppError(`El usuario "${username}" ya existe.`, 409);
  }
}

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const allUsers = await db.select().from(users);
  res.status(200).json(allUsers.map(toSafeUser));
});

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
  res.status(200).json(toSafeUser(updated));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const [existingUser] = await db.select().from(users).where(eq(users.id, id));
  if (!existingUser) {
    throw new AppError(`El usuario con id ${id} no existe.`, 404);
  }

  await db.delete(users).where(eq(users.id, id));
  res.status(204).send();
});
