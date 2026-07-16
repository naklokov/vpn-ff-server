import express from "express";
import { userRouter } from "./routes/user.routes";
import { paymentRouter } from "./routes/payment.routes";
import { mailRouter } from "./routes/mail.routes";
import { apiTokenMiddleware } from "./middlewares/api-token.middleware";
import { env } from "./config/env";
import { errorLoggingMiddleware } from "./middlewares/error-logging.middleware";
import { logger } from "./utils/logger";

const app = express();

app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(errorLoggingMiddleware);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api", apiTokenMiddleware);
app.use("/api/users", userRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/mail", mailRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === "entity.too.large"
  ) {
    logger.warn("Request body is too large", {
      limit: env.jsonBodyLimit,
    });
    res.status(413).json({ message: "Файл слишком большой для проверки платежа" });
    return;
  }
  logger.error("Unhandled application error", error);
  next(error);
});

export { app };
