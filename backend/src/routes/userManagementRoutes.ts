import { Router } from "express";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../controllers/userManagementController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { userCreateBody, userIdParams, userUpdateBody } from "../validators/userValidators.js";

export const userManagementRoutes = Router();

userManagementRoutes.get("/", listUsers);
userManagementRoutes.post("/", validateRequest({ body: userCreateBody }), createUser);
userManagementRoutes.put("/:id", validateRequest({ params: userIdParams, body: userUpdateBody }), updateUser);
userManagementRoutes.delete("/:id", validateRequest({ params: userIdParams }), deleteUser);
