import { app } from "./app";
import { connectToDb } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const startServer = async (): Promise<void> => {
  try {
    await connectToDb();
    app.listen(env.port, () => {
      logger.info("Server started", { port: env.port });
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

void startServer();
