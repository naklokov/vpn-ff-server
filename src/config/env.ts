import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["MONGO_URI", "API_TOKEN"] as const;

requiredEnv.forEach((envName) => {
  if (!process.env[envName]) {
    throw new Error(`Environment variable ${envName} is required`);
  }
});

export const env = {
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGO_URI as string,
  mongoUserCollection: process.env.MONGO_USER_COLLECTION?.trim() || undefined,
  apiToken: process.env.API_TOKEN as string,
  remnawaveApiUrl: process.env.REMNAWAVE_API_URL ?? "",
  remnawaveApiToken: process.env.REMNAWAVE_API_TOKEN ?? "",
  remnawaveNewUserTag: process.env.REMNAWAVE_NEW_USER_TAG ?? "",
  serverPrefix: process.env.SERVER_PREFIX ?? "",
};
