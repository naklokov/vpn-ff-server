import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["MONGO_URI", "API_TOKEN"] as const;

requiredEnv.forEach((envName) => {
  if (!process.env[envName]) {
    throw new Error(`Environment variable ${envName} is required`);
  }
});

const trimTrailingSlash = (value: string): string =>
  value.replace(/\/+$/, "");

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
  /** Ссылка на веб-вход (например https://vpn.example.com) */
  publicAppUrl: process.env.PUBLIC_APP_URL?.trim()
    ? trimTrailingSlash(process.env.PUBLIC_APP_URL.trim())
    : "",
  /** Ссылка на инструкции по подключению (сайт, Notion и т.п.) */
  vpnInstructionsUrl: process.env.VPN_INSTRUCTIONS_URL?.trim() ?? "",
};
