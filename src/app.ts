import express from "express";
import { userRouter } from "./routes/user.routes";
import { paymentRouter } from "./routes/payment.routes";
import { apiTokenMiddleware } from "./middlewares/api-token.middleware";
import { env } from "./config/env";

const app = express();

app.use(express.json({ limit: env.jsonBodyLimit }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api", apiTokenMiddleware);
app.use("/api/users", userRouter);
app.use("/api/payments", paymentRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === "entity.too.large"
  ) {
    res.status(413).json({ message: "Файл слишком большой для проверки платежа" });
    return;
  }
  next(error);
});

export { app };
