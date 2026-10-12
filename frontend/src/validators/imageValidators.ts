import { z } from "zod";
import { FILENAME_PATTERN, IMAGE_MIME_TYPES, IMAGE_SIGNATURES, LIMITS } from "./injectionPatterns.js";

export const imageFileInfo = z.object({
  name: z.string().regex(FILENAME_PATTERN, "el nombre del archivo no es válido"),
  type: z.enum(IMAGE_MIME_TYPES, { error: "debe ser una imagen JPEG, PNG, WEBP o GIF" }),
  size: z
    .number()
    .int()
    .positive("el archivo está vacío")
    .max(LIMITS.imageBytes, "supera el tamaño máximo de 4 MB"),
});

/**
 * Indica si unos bytes empiezan con la firma de una imagen soportada.
 *
 * @param bytes - Primeros bytes del archivo.
 * @returns `true` si es JPEG, PNG, GIF o WEBP.
 */
export function hasImageSignature(bytes: Uint8Array): boolean {
  return IMAGE_SIGNATURES.some((signature) => signature.every((byte, index) => bytes[index] === byte));
}

/**
 * Valida un archivo elegido para subir: nombre, tipo, tamaño y firma real de los primeros bytes.
 *
 * @param file - Archivo elegido en el selector.
 * @returns El mensaje del primer problema, o `null` si el archivo es válido.
 */
export async function validateImageFile(file: File): Promise<string | null> {
  const info = imageFileInfo.safeParse({ name: file.name, type: file.type, size: file.size });
  if (!info.success) {
    const issue = info.error.issues[0]!;
    return `La foto ${issue.message}.`;
  }

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return hasImageSignature(head) ? null : "El archivo no es una imagen válida.";
}
