import mongoose from "mongoose";
import { env } from "./env";

export const connectToDb = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
  const dbName = mongoose.connection.db?.databaseName;
  const collectionHint = env.mongoUserCollection ?? "users (по умолчанию для модели User)";
  console.log(`MongoDB: подключено к базе "${dbName}", коллекция пользователей: ${collectionHint}`);
};
