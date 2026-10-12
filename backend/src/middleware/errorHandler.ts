import type { NextFunction, Request, RequestHandler, Response } from "express";

export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  /**
   * @param message - Mensaje legible para el cliente.
   * @param statusCode - Código HTTP de la respuesta.
   * @param details - Información adicional opcional.
   */
  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Envuelve un handler asíncrono para enviar sus errores a `next`.
 *
 * @param handler - Handler de Express que puede rechazar su promesa.
 * @returns Un handler que nunca deja rechazos sin capturar.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Responde 404 para las rutas que no existen.
 *
 * @param req - Petición no atendida.
 * @param res - Respuesta.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    message: `La ruta ${req.method} ${req.originalUrl} no existe.`,
  });
}

/**
 * Convierte cualquier error en una respuesta JSON: usa el código del AppError o 500.
 *
 * @param error - Error lanzado por la cadena de handlers.
 * @param _req - Petición (no se usa).
 * @param res - Respuesta.
 * @param _next - Siguiente handler (no se usa).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Error interno del servidor.";
  console.error(error);
  res.status(500).json({ message });
}
