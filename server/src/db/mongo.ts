// Stubbed Mongo connection: no-op to fully disconnect DB usage when running locally
import mongoose from "mongoose";
import { env } from "../config/env";

export const connectMongo = async () => {
  // Intentionally not connecting to any external DB.
  // Keep function for compatibility with existing startup flow.
  // If you want to re-enable DB, restore mongoose.connect using env vars.
  console.info('connectMongo: skipped (DB disabled)');
  return Promise.resolve();
};

export const disconnectMongo = async () => {
  console.info('disconnectMongo: skipped (DB disabled)');
  return Promise.resolve();
};

export const mongoState = () => 0; // 0 = disconnected

