import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { categoryBody, categoryIdParams } from "../validators/categoryValidators.js";

export const categoryRoutes = Router();

categoryRoutes.get("/", listCategories);
categoryRoutes.get("/:id", validateRequest({ params: categoryIdParams }), getCategory);
categoryRoutes.post("/", validateRequest({ body: categoryBody }), createCategory);
categoryRoutes.put("/:id", validateRequest({ params: categoryIdParams, body: categoryBody }), updateCategory);
categoryRoutes.delete("/:id", validateRequest({ params: categoryIdParams }), deleteCategory);
