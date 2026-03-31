import express from "express";
import { userRouter } from "./routes/user.routes";
import { paymentRouter } from "./routes/payment.routes";
import { apiTokenMiddleware } from "./middlewares/api-token.middleware";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api", apiTokenMiddleware);
app.use("/api/users", userRouter);
app.use("/api/payments", paymentRouter);

export { app };
