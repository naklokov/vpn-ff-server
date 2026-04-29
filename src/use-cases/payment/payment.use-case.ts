import mongoose from "mongoose";
import { paymentRepository } from "../../repositories/payment.repository";
import {
  CheckPaymentDto,
  CheckPaymentResponseDto,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "../../types/payment.types";
import { checkPaymentByFile } from "../../utils/payment-recognize";
import { normalizeRuPhoneToMsisdn } from "../../utils/phone";
import { userUseCase } from "../user/user.use-case";

export class PaymentUseCase {
  async getAll() {
    return paymentRepository.findAll();
  }

  async add(input: CreatePaymentDto) {
    if (
      input.period === undefined ||
      input.amount === undefined ||
      !input.phone ||
      !input.date
    ) {
      throw new Error("period, amount, phone и date обязательны");
    }

    const normalizedPhone = normalizeRuPhoneToMsisdn(input.phone);
    const existingPayment = await paymentRepository.findByPhoneAndAmount(
      normalizedPhone,
      input.amount,
    );
    if (existingPayment) {
      throw new Error("Оплата по этому номеру уже была произведена");
    }

    // For UI payment flow: successful payment should immediately extend user access
    // and apply referral bonus logic on server side.
    await userUseCase.extendByPhone(normalizedPhone, {
      months: input.period,
    });

    return paymentRepository.create({
      ...input,
      phone: normalizedPhone,
    });
  }

  async update(paymentId: string, input: UpdatePaymentDto) {
    if (!Object.keys(input).length) {
      throw new Error("Тело запроса пустое");
    }

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new Error("Некорректный payment id");
    }

    const updated = await paymentRepository.updateById(paymentId, input);
    if (!updated) {
      throw new Error("Платеж не найден");
    }

    return updated;
  }

  async checkPayment(input: CheckPaymentDto): Promise<CheckPaymentResponseDto> {
    if (
      input.amount === undefined ||
      !Number.isFinite(input.amount) ||
      input.amount <= 0 ||
      !input.fileBase64
    ) {
      throw new Error("amount и fileBase64 обязательны");
    }

    const isPayCorrect = await checkPaymentByFile(
      input.amount,
      input.fileBase64,
      input.mimeType,
    );

    return { result: isPayCorrect };
  }
}

export const paymentUseCase = new PaymentUseCase();
