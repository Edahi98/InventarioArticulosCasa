import express from "express";
import cors from "cors";
import path from "node:path";
import { categoryRoutes } from "./routes/categoryRoutes.js";
import { articleRoutes } from "./routes/articleRoutes.js";
import { noteRoutes, articleNoteRoutes } from "./routes/noteRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { downloadInventoryReport } from "./controllers/reportController.js";
import { userManagementRoutes } from "./routes/userManagementRoutes.js";
import { searchRoutes } from "./routes/searchRoutes.js";

export const app = express();

app.use(cors());
app.use(express.json());

// Sirve archivos subidos via FTP cuando STORAGE=ftp
if (process.env.STORAGE === "ftp") {
  const ftpFilesPath = process.env.FTP_LOCAL_PATH ?? path.join(process.cwd(), "ftpfiles");
  app.use("/files", express.static(ftpFilesPath));
}

app.use("/auth", authRoutes);

app.use("/categories", authMiddleware, categoryRoutes);
app.use("/articles", authMiddleware, articleRoutes);
app.use("/articles", authMiddleware, articleNoteRoutes);
app.use("/notes", authMiddleware, noteRoutes);
app.use("/users", authMiddleware, userManagementRoutes);
app.get("/reports/inventory", authMiddleware, downloadInventoryReport);
app.use("/search", authMiddleware, searchRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(notFoundHandler);
app.use(errorHandler);
