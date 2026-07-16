import dotenv from "dotenv";
import { normalizeUiBaseUrl } from "../utils/ui-base-url";

dotenv.config();

const requiredEnv = ["MONGO_URI", "API_TOKEN"] as const;

requiredEnv.forEach((envName) => {
  if (!process.env[envName]) {
    throw new Error(`Environment variable ${envName} is required`);
  }
});

const uiBaseUrlSource =
  process.env.UI_REGISTER_URL?.trim() ||
  process.env.PUBLIC_APP_URL?.trim() ||
  "";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? "15mb",
  mongoUri: process.env.MONGO_URI as string,
  mongoUserCollection: process.env.MONGO_USER_COLLECTION?.trim() || undefined,
  apiToken: process.env.API_TOKEN as string,
  remnawaveApiUrl: process.env.REMNAWAVE_API_URL ?? "",
  remnawaveApiToken: process.env.REMNAWAVE_API_TOKEN ?? "",
  remnawaveNewUserTag: process.env.REMNAWAVE_NEW_USER_TAG ?? "",
  serverPrefix: process.env.SERVER_PREFIX ?? "",
  /** Brevo transactional API */
  brevoApiUrl: process.env.BREVO_API_URL?.trim() || "https://api.brevo.com",
  brevoApiKey: process.env.BREVO_API_KEY?.trim() || "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL?.trim() || "",
  brevoSenderName: process.env.BREVO_SENDER_NAME?.trim() || "",
  /** Публичная ссылка на Telegram-бота (для писем и т.п.) */
  telegramBotUrl:
    process.env.TELEGRAM_BOT_URL?.trim() ||
    "https://t.me/friendly_vpn_ff_bot",
  /**
   * Базовый URL веб-приложения (из `UI_REGISTER_URL`; при миграции — из `PUBLIC_APP_URL`).
   * К нему на сервере и в боте дописываются пути: `/register`, `/payment`, `/login`.
   */
  uiBaseUrl: normalizeUiBaseUrl(uiBaseUrlSource),
  /** Ссылка на инструкции по подключению (сайт, Notion и т.п.) */
  vpnInstructionsUrl: process.env.VPN_INSTRUCTIONS_URL?.trim() ?? "",

  /** Ежедневные email-напоминания об оплате (как у бота): последние 3 календарных дня подписки */
  paymentReminderEmailEnabled:
    (process.env.PAYMENT_REMINDER_EMAIL_ENABLED ?? "true").toLowerCase() !==
    "false",
  paymentReminderEmailCron:
    process.env.PAYMENT_REMINDER_EMAIL_CRON?.trim() || "0 12 * * *",
  paymentReminderEmailTimezone:
    process.env.PAYMENT_REMINDER_EMAIL_TIMEZONE?.trim() || "Europe/Moscow",
};
