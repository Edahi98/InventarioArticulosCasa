import type { Request, Response } from "express";
import { excelReportService } from "../services/excelReportService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const downloadInventoryReport = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await excelReportService.generateInventoryReport();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="inventario-reporte.xlsx"');
  res.status(200).send(buffer);
});
