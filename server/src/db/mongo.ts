import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "../config/env";
import { logger } from "../middlewares/logger";

let isConnected = false;
let mongod: MongoMemoryServer | null = null;

export const connectMongo = async () => {
  if (isConnected) return;

  try {
    logger.info("Attempting to connect to MongoDB...");
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      minPoolSize: env.MONGODB_MIN_POOL_SIZE,
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
      serverSelectionTimeoutMS: 5000, // Fail fast to fallback
    });
    isConnected = true;
    logger.info("MongoDB connected successfully");
  } catch (err) {
    logger.warn({ err }, "Failed to connect to primary MongoDB URI");
    
    // Fallback to in-memory database in development
    if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
      logger.info("Falling back to in-memory MongoDB...");
      try {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri, {
          dbName: env.MONGODB_DB_NAME,
        });
        isConnected = true;
        logger.info(`In-memory MongoDB connected at ${uri}`);
      } catch (memErr) {
        logger.error({ err: memErr }, "Failed to start in-memory MongoDB");
        throw memErr;
      }
    } else {
      throw err;
    }
  }
};

export const disconnectMongo = async () => {
  try {
    if (!isConnected) return;
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
    isConnected = false;
    logger.info("MongoDB disconnected");
  } catch (err) {
    logger.error({ err }, "Failed to disconnect from MongoDB");
    throw err;
  }
};

export const mongoState = () => (isConnected ? 1 : 0);

