import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../middlewares/logger";

let isConnected = false;

export const connectMongo = async () => {
  try {
    if (isConnected) return;
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      minPoolSize: env.MONGODB_MIN_POOL_SIZE,
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
    });
    isConnected = true;
    logger.info("MongoDB connected successfully");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    throw err;
  }
};

export const disconnectMongo = async () => {
  try {
    if (!isConnected) return;
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected");
  } catch (err) {
    logger.error({ err }, "Failed to disconnect from MongoDB");
    throw err;
  }
};

export const mongoState = () => (isConnected ? 1 : 0);

