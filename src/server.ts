import { app } from "./app";
import { connectToDb } from "./config/db";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
  try {
    await connectToDb();
    app.listen(env.port, () => {
      console.log(`Server started on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void startServer();
