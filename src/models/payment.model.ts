import { Schema, model, Document } from "mongoose";

export interface IPayment extends Document {
  chatId: number;
  period: number;
  amount: number;
  phone: string;
  date: string;
}

const paymentSchema = new Schema<IPayment>(
  {
    chatId: { type: Number, required: true },
    period: { type: Number, required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    date: { type: String, required: true },
  },
  { versionKey: false, timestamps: true },
);

export const PaymentModel = model<IPayment>("payments", paymentSchema);

