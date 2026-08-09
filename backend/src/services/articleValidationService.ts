import { AppError } from "../middleware/errorHandler.js";

export class ArticleValidationService {
  requireNonNegativeInteger(value: unknown, fieldName: string): number {
    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue < 0) {
      throw new AppError(`El campo "${fieldName}" debe ser un número entero no negativo.`, 400);
    }
    return numericValue;
  }
}

export const articleValidationService = new ArticleValidationService();
