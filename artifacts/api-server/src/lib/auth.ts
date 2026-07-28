import jwt from "jsonwebtoken";
import { type User } from "@workspace/db";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

export function generateToken(user: User) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
}
