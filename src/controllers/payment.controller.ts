import { Request, Response } from "express";
import { paymentUseCase } from "../use-cases/payment/payment.use-case";
import {
  CheckPaymentDto,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "../types/payment.types";

export const addPayment = async (
  req: Request<unknown, unknown, CreatePaymentDto>,
  res: Response,
): Promise<void> => {
  try {
    const payment = await paymentUseCase.add(req.body);
    res.status(201).json(payment);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка при добавлении платежа";
    const statusCode =
      message === "chatId, period, amount, phone и date обязательны" ? 400 : 500;
    res.status(statusCode).json({ message });
  }
};

export const getPayments = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payments = await paymentUseCase.getAll();
    res.status(200).json(payments);
  } catch {
    res.status(500).json({ message: "Ошибка при получении платежей" });
  }
};

export const updatePaymentById = async (
  req: Request<{ id: string }, unknown, UpdatePaymentDto>,
  res: Response,
): Promise<void> => {
  try {
    const updatedPayment = await paymentUseCase.update(req.params.id, req.body);
    res.status(200).json(updatedPayment);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка при обновлении платежа";
    const statusCode =
      message === "Тело запроса пустое" || message === "Некорректный payment id"
        ? 400
        : message === "Платеж не найден"
          ? 404
          : 500;
    res.status(statusCode).json({ message });
  }
};

export const checkPayment = async (
  req: Request<unknown, unknown, CheckPaymentDto>,
  res: Response,
): Promise<void> => {
  try {
    const result = await paymentUseCase.checkPayment(req.body);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка при проверке платежа";
    const statusCode = message === "amount и fileBase64 обязательны" ? 400 : 500;
    res.status(statusCode).json({ message });
  }
};

