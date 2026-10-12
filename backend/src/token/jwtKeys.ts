import { createHash, createPrivateKey, createPublicKey, type JsonWebKey, type KeyObject } from "node:crypto";
import { AppError } from "../middleware/errorHandler.js";
import { JWT_ALGORITHM } from "./jwtConfig.js";

export interface PublishedJwk extends JsonWebKey {
  kid: string;
  use: "sig";
  alg: string;
}

export class JwtKeys {
  private privateKeyCache: KeyObject | null = null;
  private publicKeyCache: KeyObject | null = null;

  /**
   * Normaliza el valor de `JWT_PRIVATE_KEY`: quita comillas y retornos de carro, convierte los `\n` literales
   * en saltos de línea y, si solo se pegó el cuerpo base64, le agrega los encabezados PEM.
   *
   * @param raw - Valor tal como llegó de la variable de entorno.
   * @returns El texto PEM listo para parsear.
   */
  private toPem(raw: string): string {
    const unquoted = raw.trim().replace(/^(["'])([\s\S]*)\1$/, "$2");
    const text = unquoted.replace(/\\r/g, "").replace(/\r/g, "").replace(/\\n/g, "\n").trim();
    if (text.includes("-----BEGIN")) {
      return text;
    }
    const lines = text.replace(/\s+/g, "").match(/.{1,64}/g) ?? [];
    return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----`;
  }

  /**
   * Carga la clave privada RSA con la que se firman los tokens (solo vive en este servidor).
   *
   * @returns La clave privada.
   * @throws AppError 500 si `JWT_PRIVATE_KEY` falta o no es un PEM válido.
   */
  privateKey(): KeyObject {
    if (this.privateKeyCache) {
      return this.privateKeyCache;
    }
    const raw = process.env.JWT_PRIVATE_KEY;
    if (!raw?.trim()) {
      throw new AppError("JWT_PRIVATE_KEY no está configurada en el servidor.", 500);
    }

    const pem = this.toPem(raw);
    try {
      this.privateKeyCache = createPrivateKey(pem);
    } catch {
      const truncated = pem.includes("-----BEGIN") && !pem.includes("-----END");
      const hint = truncated ? ", falta la línea END: probablemente quedó cortada, ponla entre comillas dobles" : "";
      console.error(`JWT_PRIVATE_KEY no se pudo leer (${pem.length} caracteres${hint}). Genera una con "npm run keys:generate".`);
      throw new AppError(
        'JWT_PRIVATE_KEY no es una clave privada PEM válida. Genera una con "npm run keys:generate" y pega la línea completa, con comillas, en backend/.env.',
        500,
      );
    }
    return this.privateKeyCache;
  }

  /**
   * Deriva la clave pública a partir de la privada; sirve para verificar, nunca para firmar.
   *
   * @returns La clave pública.
   */
  publicKey(): KeyObject {
    this.publicKeyCache ??= createPublicKey(this.privateKey());
    return this.publicKeyCache;
  }

  /**
   * Identificador de la clave (`kid`): huella SHA-256 de su forma pública.
   *
   * @returns Los primeros 16 caracteres hexadecimales de la huella.
   */
  keyId(): string {
    const der = this.publicKey().export({ type: "spki", format: "der" });
    return createHash("sha256").update(der).digest("hex").slice(0, 16);
  }

  /**
   * La clave pública en formato JWK, lista para publicarse en el JWKS.
   *
   * @returns El JWK con `kid`, `use` y `alg`.
   */
  publicJwk(): PublishedJwk {
    return {
      ...this.publicKey().export({ format: "jwk" }),
      kid: this.keyId(),
      use: "sig",
      alg: JWT_ALGORITHM,
    };
  }
}

export const jwtKeys = new JwtKeys();
