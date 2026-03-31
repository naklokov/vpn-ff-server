import axios, { AxiosInstance } from "axios";
import { CreateUserDto, UpdateUserDto } from "../types/user.types";
import {
  CheckPaymentDto,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "../types/payment.types";

type ApiClientConfig = {
  baseUrl: string;
  apiToken: string;
};

export class ServerApiClient {
  private readonly http: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        "x-api-token": config.apiToken,
      },
      timeout: 10_000,
    });
  }

  async getUsers() {
    const { data } = await this.http.get("/api/users");
    return data;
  }

  async addUser(payload: CreateUserDto) {
    const { data } = await this.http.post("/api/users", payload);
    return data;
  }

  async updateUserByPhone(phone: string, payload: UpdateUserDto) {
    const { data } = await this.http.patch(`/api/users/${encodeURIComponent(phone)}`, payload);
    return data;
  }

  async getPayments() {
    const { data } = await this.http.get("/api/payments");
    return data;
  }

  async addPayment(payload: CreatePaymentDto) {
    const { data } = await this.http.post("/api/payments", payload);
    return data;
  }

  async updatePaymentById(paymentId: string, payload: UpdatePaymentDto) {
    const { data } = await this.http.patch(
      `/api/payments/${encodeURIComponent(paymentId)}`,
      payload,
    );
    return data;
  }

  async checkPayment(payload: CheckPaymentDto) {
    const { data } = await this.http.post("/api/payments/check-payment", payload);
    return data;
  }
}

