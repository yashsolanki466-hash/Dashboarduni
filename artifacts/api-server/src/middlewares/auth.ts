import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../lib/auth";

declare module "express" {
  export interface Request {
    user?: { id: number; username: string; role: string };
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.cookies?.token;

  if (!token) {
    res.status(401).json({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Missing authentication token" });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid authentication token" });
  }
}

export function authorizeRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Not authenticated" });
      return;
    }

    if (!roles.includes(req.user.role) && req.user.role !== "Admin") {
      res.status(403).json({ type: "about:blank", title: "Forbidden", status: 403, detail: "Insufficient permissions" });
      return;
    }

    next();
  };
}
