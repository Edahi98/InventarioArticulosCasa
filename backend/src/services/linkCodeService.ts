import { createHash, randomInt } from "node:crypto";
import { and, eq, gt, lte, or } from "drizzle-orm";
import { db, linkCodes } from "../db/client.js";
import { LINK_CODE_TTL_SECONDS } from "../token/jwtConfig.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export interface CreatedLinkCode {
  code: string;
  expiresAt: Date;
}

export class LinkCodeService {
  /**
   * Normaliza un código escrito por una persona: quita guiones y espacios y pasa a mayúsculas.
   *
   * @param code - Código tal como lo escribió o pegó la persona.
   * @returns El código en su forma canónica.
   */
  normalize(code: string): string {
    return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  }

  /**
   * Calcula el hash con el que se guarda y consulta un código; el código en claro nunca llega a la base de datos.
   *
   * @param code - Código ya normalizado.
   * @returns Hash SHA-256 en hexadecimal.
   */
  private hash(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }

  /**
   * Genera un código de un solo uso para vincular Telegram a la cuenta del usuario.
   * Reemplaza cualquier código anterior del mismo usuario y limpia los vencidos.
   *
   * @param userId - Usuario que inició sesión en la web.
   * @returns El código en claro (se muestra una sola vez) y su vencimiento.
   */
  async create(userId: number): Promise<CreatedLinkCode> {
    const code = Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    const expiresAt = new Date(Date.now() + LINK_CODE_TTL_SECONDS * 1000);

    await db.delete(linkCodes).where(or(lte(linkCodes.expiresAt, new Date()), eq(linkCodes.userId, userId)));
    await db.insert(linkCodes).values({ userId, codeHash: this.hash(code), expiresAt });
    return { code, expiresAt };
  }

  /**
   * Canjea un código: lo elimina de forma atómica, así solo se puede usar una vez.
   *
   * @param code - Código recibido (se normaliza antes de buscarlo).
   * @returns El id del usuario dueño del código, o `null` si no existe o ya venció.
   */
  async consume(code: string): Promise<number | null> {
    const [claimed] = await db
      .delete(linkCodes)
      .where(and(eq(linkCodes.codeHash, this.hash(this.normalize(code))), gt(linkCodes.expiresAt, new Date())))
      .returning({ userId: linkCodes.userId });
    return claimed?.userId ?? null;
  }
}

export const linkCodeService = new LinkCodeService();
