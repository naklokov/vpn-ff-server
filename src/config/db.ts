import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export const connectToDb = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
  const dbName = mongoose.connection.db?.databaseName;
  const collectionHint = env.mongoUserCollection ?? "users (по умолчанию для модели User)";
  logger.info("MongoDB connected", {
    dbName,
    collectionHint,
  });
};
