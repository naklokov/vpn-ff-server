import axios, { AxiosInstance, isAxiosError } from "axios";
import { env } from "../../config/env";
import { appendEmailFooter } from "./email-footer";

export function isBrevoConfigured(): boolean {
  return Boolean(env.brevoApiKey && env.brevoSenderEmail);
}

function getBrevoErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : "Ошибка Brevo API";
  }

  const data = error.response?.data as
    | { message?: string; code?: string }
    | undefined;
  if (data?.message) {
    return data.message;
  }

  return error.message;
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

    const { text, html } = appendEmailFooter({
      text: input.text,
      html: input.html,
    });

    try {
      await this.http.post(
        "/v3/smtp/email",
        {
          sender: {
            email: env.brevoSenderEmail,
            ...(env.brevoSenderName ? { name: env.brevoSenderName } : {}),
          },
          to: [{ email: input.to }],
          subject: input.subject,
          htmlContent: html,
          textContent: text,
        },
        {
          headers: {
            "api-key": env.brevoApiKey,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error: unknown) {
      throw new Error(getBrevoErrorMessage(error));
    }
  }
}

export const brevoMailClient = new BrevoMailClient();
