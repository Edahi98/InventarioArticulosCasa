import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodError, ZodType } from "zod";
import { AppError } from "./errorHandler.js";

interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
  file?: ZodType;
}

/**
 * Convierte los problemas de zod en una lista `{ field, message }` sin devolver el valor recibido.
 *
 * @param error - Error de validación de zod.
 * @param source - Parte de la petición validada (`body`, `params`, `query` o `file`).
 * @returns Los problemas legibles por el cliente.
 */
function describeIssues(error: ZodError, source: string): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: [source, ...issue.path].join("."),
    message: issue.message,
  }));
}

/**
 * Crea un middleware que valida con zod el cuerpo, los parámetros, la query y el archivo de la petición.
 * Si todo es válido sustituye cada parte por su versión ya normalizada (recortada, convertida y sin campos extra).
 *
 * @param schemas - Esquema de zod para cada parte que se quiera validar.
 * @returns Un middleware de Express.
 * @throws AppError 400 con `details` por campo cuando alguna parte no es válida.
 */
export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const issues: { field: string; message: string }[] = [];
    const checked: Record<string, unknown> = {};

    const parts: [keyof RequestSchemas, unknown][] = [
      ["params", req.params],
      ["query", req.query],
      ["body", req.body ?? {}],
      ["file", req.file],
    ];

    for (const [source, value] of parts) {
      const schema = schemas[source];
      if (!schema) continue;
      const result = schema.safeParse(value);
      if (result.success) {
        checked[source] = result.data;
      } else {
        issues.push(...describeIssues(result.error, source));
      }
    }

    if (issues.length > 0) {
      const summary = issues.map((issue) => `${issue.field.split(".").slice(1).join(".")} ${issue.message}`).join("; ");
      next(new AppError(`Datos no válidos: ${summary}.`, 400, issues));
      return;
    }

    if (checked.params) req.params = checked.params as Request["params"];
    if (checked.query) req.query = checked.query as Request["query"];
    if (checked.body) req.body = checked.body;
    next();
  };
}
