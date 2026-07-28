import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error({ err, req: { method: req.method, url: req.url } }, "Unhandled exception");

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" && status === 500
    ? "Internal Server Error"
    : err.message || "An unexpected error occurred.";

  res.status(status).json({
    type: "about:blank",
    title: status === 500 ? "Internal Server Error" : "Error",
    status,
    detail: message,
    instance: req.originalUrl,
  });
}
