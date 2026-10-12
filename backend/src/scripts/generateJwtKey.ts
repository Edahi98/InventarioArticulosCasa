import { generateKeyPairSync } from "node:crypto";

/**
 * Genera un par RSA de 2048 bits y escribe en pantalla la línea `JWT_PRIVATE_KEY="..."` para el `.env`.
 * Va entre comillas dobles: sin ellas, dotenv corta el valor en el primer salto de línea.
 * La clave privada no se guarda en ningún archivo.
 *
 * Uso: `npm run keys:generate`.
 */
function main(): void {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });

  console.log("Copia esta línea completa en backend/.env, con las comillas (mantén la clave en secreto):\n");
  console.log(`JWT_PRIVATE_KEY="${privateKey.trim().replace(/\n/g, "\\n")}"`);
}

main();
