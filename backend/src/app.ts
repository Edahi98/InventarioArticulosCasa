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
import { generalLimiter } from "./middleware/rateLimiters.js";

export const app = express();

const TRUSTED_PROXY_HOPS = Number(process.env.TRUST_PROXY ?? (process.env.VERCEL ? 1 : 0));

app.set("trust proxy", TRUSTED_PROXY_HOPS);
app.use(helmet());
app.use(cors());
app.use(generalLimiter);
app.use(express.json());

app.use("/auth", authRoutes);

app.use("/categories", authMiddleware, categoryRoutes);
app.use("/articles", authMiddleware, articleRoutes);
app.use("/articles", authMiddleware, articleNoteRoutes);
app.use("/notes", authMiddleware, noteRoutes);
app.use("/users", authMiddleware, userManagementRoutes);
app.get("/reports/inventory", authMiddleware, downloadInventoryReport);
app.use("/search", authMiddleware, searchRoutes);

/**
 * GET / — comprobación de salud del servicio.
 */
app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(notFoundHandler);
app.use(errorHandler);
