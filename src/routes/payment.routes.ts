import { Router } from "express";
import {
  addPayment,
  checkPayment,
  getPayments,
  updatePaymentById,
} from "../controllers/payment.controller";

const paymentRouter = Router();

paymentRouter.post("/", addPayment);
paymentRouter.post("/check-payment", checkPayment);
paymentRouter.get("/", getPayments);
paymentRouter.patch("/:id", updatePaymentById);

export { paymentRouter };

