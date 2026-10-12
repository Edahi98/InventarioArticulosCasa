import { createHash } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { db, sessions } from "../db/client.js";

export class SessionService {
  /**
   * Calcula el hash con el que se guarda y consulta un token; el JWT en claro nunca llega a la base de datos.
   *
   * @param token - JWT emitido al usuario.
   * @returns Hash SHA-256 en hexadecimal.
   */
  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * Registra la sesión de un token recién emitido y limpia las sesiones ya vencidas.
   *
   * @param userId - Usuario dueño de la sesión.
   * @param token - JWT emitido.
   * @param expiresAt - Momento en que el token deja de ser válido.
   */
  async create(userId: number, token: string, expiresAt: Date): Promise<void> {
    await db.delete(sessions).where(lte(sessions.expiresAt, new Date()));
    await db.insert(sessions).values({ userId, tokenHash: this.hash(token), expiresAt });
  }

  /**
   * Indica si el token tiene una sesión vigente de ese usuario.
   *
   * @param userId - Usuario que declara el token.
   * @param token - JWT recibido en la petición.
   * @returns `true` si la sesión existe, es del usuario y no ha vencido.
   */
  async isActive(userId: number, token: string): Promise<boolean> {
    const [session] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, this.hash(token)),
          eq(sessions.userId, userId),
          gt(sessions.expiresAt, new Date()),
        ),
      );
    return Boolean(session);
  }

  /**
   * Cierra la sesión de un token.
   *
   * @param token - JWT cuya sesión se elimina.
   */
  async revoke(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.tokenHash, this.hash(token)));
  }

  /**
   * Cierra todas las sesiones de un usuario (por ejemplo, tras cambiar su contraseña).
   *
   * @param userId - Usuario cuyas sesiones se eliminan.
   */
  async revokeAllForUser(userId: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

export const sessionService = new SessionService();
