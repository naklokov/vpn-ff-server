import axios, { AxiosInstance } from "axios";
import { env } from "../../config/env";

export function isBrevoConfigured(): boolean {
  return Boolean(env.brevoApiKey && env.brevoSenderEmail);
}

export class BrevoMailClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.brevoApiUrl,
      timeout: 15_000,
    });
  }

  async sendTransactionalEmail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    if (!isBrevoConfigured()) {
      throw new Error("Brevo API не настроен");
    }

    await this.http.post(
      "/v3/smtp/email",
      {
        sender: {
          email: env.brevoSenderEmail,
          ...(env.brevoSenderName ? { name: env.brevoSenderName } : {}),
        },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
      },
      {
        headers: {
          "api-key": env.brevoApiKey,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
  }
}

export const brevoMailClient = new BrevoMailClient();
