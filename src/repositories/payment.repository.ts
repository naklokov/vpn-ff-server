import { PaymentModel, IPayment } from "../models/payment.model";
import { CreatePaymentDto, UpdatePaymentDto } from "../types/payment.types";

export class PaymentRepository {
  async create(data: CreatePaymentDto): Promise<IPayment> {
    return PaymentModel.create(data);
  }

  async findAll(): Promise<IPayment[]> {
    return PaymentModel.find({});
  }

  async findByPhoneAndAmount(
    phone: string,
    amount: number,
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({ phone, amount });
  }

  async updateById(paymentId: string, data: UpdatePaymentDto): Promise<IPayment | null> {
    return PaymentModel.findByIdAndUpdate(
      paymentId,
      { $set: data },
      { new: true, runValidators: true },
    );
  }
}

export const paymentRepository = new PaymentRepository();

