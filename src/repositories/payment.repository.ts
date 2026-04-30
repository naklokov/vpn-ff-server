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
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return PaymentModel.findOne({
      phone,
      amount,
      createdAt: { $gte: oneDayAgo },
    });
  }

  async updateById(
    paymentId: string,
    data: UpdatePaymentDto,
  ): Promise<IPayment | null> {
    return PaymentModel.findByIdAndUpdate(
      paymentId,
      { $set: data },
      { new: true, runValidators: true },
    );
  }
}

export const paymentRepository = new PaymentRepository();
