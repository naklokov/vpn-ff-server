import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const API_TOKEN_HEADER = "x-api-token";

export const apiTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const headerToken = req.header(API_TOKEN_HEADER);

  if (!headerToken) {
    res.status(401).json({ message: `Отсутствует заголовок ${API_TOKEN_HEADER}` });
    return;
  }

  if (headerToken !== env.apiToken) {
    res.status(401).json({ message: "Неверный API token" });
    return;
  }

  next();
};

export { API_TOKEN_HEADER };

