import type { Request } from "express";
import morgan from "morgan";

morgan.token("user", (req) => (req as Request).auth?.username ?? "-");

const PRODUCTION_FORMAT =
  ':remote-addr :user ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms';

export const requestLogger = morgan(process.env.NODE_ENV === "production" ? PRODUCTION_FORMAT : "dev", {
  skip: (req) => req.url === "/",
});
