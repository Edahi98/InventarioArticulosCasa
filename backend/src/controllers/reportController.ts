import type { Request, Response } from "express";
import { excelReportService } from "../services/excelReportService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * GET /reports/inventory — descarga el reporte de inventario en Excel (`inventario-reporte.xlsx`).
 */
export const downloadInventoryReport = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await excelReportService.generateInventoryReport();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="inventario-reporte.xlsx"');
  res.status(200).send(buffer);
});
