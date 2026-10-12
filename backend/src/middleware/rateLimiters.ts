import { rateLimit, type Options, type RateLimitRequestHandler } from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Crea un limitador por IP con cabeceras estándar (`RateLimit-*`) y respuesta JSON en español.
 *
 * @param max - Peticiones permitidas por ventana.
 * @param message - Mensaje que recibe el cliente al superar el límite.
 * @param extra - Opciones adicionales de express-rate-limit.
 * @returns Un middleware de Express que responde 429 al exceder el límite.
 */
function createLimiter(max: number, message: string, extra: Partial<Options> = {}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    ...extra,
  });
}

export const generalLimiter = createLimiter(
  300,
  "Demasiadas peticiones. Espera unos minutos e inténtalo de nuevo.",
  { skip: (req) => req.path === "/" },
);

export const loginLimiter = createLimiter(
  10,
  "Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo de nuevo.",
  { skipSuccessfulRequests: true },
);

export const uploadLimiter = createLimiter(
  30,
  "Demasiadas imágenes subidas. Espera unos minutos e inténtalo de nuevo.",
);
