import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./middlewares/logger";
import { connectMongo } from "./db/mongo";

const app = createApp();
const port = env.PORT;

const start = async () => {
  try {
    await connectMongo();
    app.listen(port, () => {
      logger.info({ port }, "Server listening");
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

start();
