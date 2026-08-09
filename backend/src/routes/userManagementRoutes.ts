import { Router } from "express";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../controllers/userManagementController.js";

export const userManagementRoutes = Router();

userManagementRoutes.get("/", listUsers);
userManagementRoutes.post("/", createUser);
userManagementRoutes.put("/:id", updateUser);
userManagementRoutes.delete("/:id", deleteUser);
