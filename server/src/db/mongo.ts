// Stubbed Mongo connection: no-op to fully disconnect DB usage when running locally
import mongoose from "mongoose";
import { env } from "../config/env";

export const connectMongo = async () => {
  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB_NAME;
  await mongoose.connect(uri, {
    dbName,
    minPoolSize: env.MONGODB_MIN_POOL_SIZE,
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });
};

export const disconnectMongo = async () => {
  await mongoose.disconnect();
};

export const mongoState = () => mongoose.connection.readyState
