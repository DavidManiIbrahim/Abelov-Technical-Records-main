import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./middlewares/logger";
import { connectMongo } from "./db/mongo";
import { ensureAdminWithSampleRequest } from "./services/admin.service";

const app = createApp();
const port = Number(process.env.PORT) || env.PORT || 4000;


const start = async () => {
  try {
    await connectMongo();
    
    // Seed database with admin user and sample data if needed
    try {
      await ensureAdminWithSampleRequest();
    } catch (seedErr) {
      logger.error({ err: seedErr }, "Failed to seed database");
      // Don't crash server if seeding fails
    }

    app.listen(port, () => {
      logger.info({ port }, "Server listening");
    });
    
    // Keep process alive
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

start();
