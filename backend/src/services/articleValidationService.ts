import { AppError } from "../middleware/errorHandler.js";

export class ArticleValidationService {
  /**
   * Exige que un valor sea un entero mayor o igual a cero.
   *
   * @param value - Valor recibido (normalmente del cuerpo de la petición).
   * @param fieldName - Nombre del campo, usado en el mensaje de error.
   * @returns El valor convertido a número.
   * @throws AppError 400 si no es un entero no negativo.
   */
  requireNonNegativeInteger(value: unknown, fieldName: string): number {
    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue < 0) {
      throw new AppError(`El campo "${fieldName}" debe ser un número entero no negativo.`, 400);
    }
    return numericValue;
  }
}

export const articleValidationService = new ArticleValidationService();
