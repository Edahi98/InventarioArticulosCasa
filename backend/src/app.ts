import express from "express";
import cors from "cors";
import helmet from "helmet";
import { categoryRoutes } from "./routes/categoryRoutes.js";
import { articleRoutes } from "./routes/articleRoutes.js";
import { noteRoutes, articleNoteRoutes } from "./routes/noteRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { downloadInventoryReport } from "./controllers/reportController.js";
import { userManagementRoutes } from "./routes/userManagementRoutes.js";
import { searchRoutes } from "./routes/searchRoutes.js";
import { scrapeRoutes } from "./routes/scrapeRoutes.js";
import { matchRoutes } from "./routes/matchRoutes.js";
import { jwksRoutes } from "./routes/jwksRoutes.js";
import { telegramLinkRoutes } from "./routes/telegramLinkRoutes.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { requestLogger } from "./middleware/requestLogger.js";

export const app = express();

const TRUSTED_PROXY_HOPS = Number(process.env.TRUST_PROXY ?? (process.env.VERCEL ? 1 : 0));

app.set("trust proxy", TRUSTED_PROXY_HOPS);
app.use(helmet());
app.use(requestLogger);
app.use(cors());
app.use(generalLimiter);
app.use(express.json());

app.use("/.well-known", jwksRoutes);
app.use("/auth/telegram", telegramLinkRoutes);
app.use("/auth", authRoutes);

app.use("/categories", authMiddleware, categoryRoutes);
app.use("/articles", authMiddleware, articleRoutes);
app.use("/articles", authMiddleware, articleNoteRoutes);
app.use("/notes", authMiddleware, noteRoutes);
app.use("/users", authMiddleware, userManagementRoutes);
app.get("/reports/inventory", authMiddleware, downloadInventoryReport);
app.use("/search", authMiddleware, searchRoutes);
app.use("/scrape", authMiddleware, scrapeRoutes);
app.use("/match", authMiddleware, matchRoutes);

/**
 * GET / — comprobación de salud del servicio.
 */
app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(notFoundHandler);
app.use(errorHandler);
