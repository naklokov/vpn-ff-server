import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export const errorLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startedAt = Date.now();

  res.on("finish", () => {
    if (res.statusCode < 400) {
      return;
    }

    logger.warn("HTTP error response", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
    });
  });

  next();
};
