import jwt from "jsonwebtoken";
import { getJwtSecret } from "../middleware/authMiddleware.js";

export default class TokenIssuer {
  issue(userId: number, username: string): string {
    return jwt.sign({ sub: String(userId), username }, getJwtSecret(), { expiresIn: "8h" });
  }
}