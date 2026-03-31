import { Schema, model, Document } from "mongoose";
import { getExpiredDateIso, getRegistrationDateIso } from "../utils/date";
import { env } from "../config/env";

export interface IUser extends Document {
  chatId?: number;
  name?: string;
  email?: string;
  phone: string;
  registrationDate: string;
  expiredDate: string;
  password: string;
  isVerify: boolean;
  isActive: boolean;
  referralUserLogin?: string;
  serverPrefix: string;
}

const userSchema = new Schema<IUser>(
  {
    chatId: { type: Number },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    registrationDate: {
      type: String,
      default: getRegistrationDateIso,
    },
    expiredDate: {
      type: String,
      default: getExpiredDateIso,
      required: true,
    },
    password: { type: String, required: true },
    isVerify: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    referralUserLogin: { type: String },
    serverPrefix: { type: String, default: env.serverPrefix },
  },
  { versionKey: false, timestamps: true },
);

export const UserModel = model<IUser>("users", userSchema);
