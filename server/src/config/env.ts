import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, "PORT must be a positive number")
    .default("4000"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((v) => Number(v))
    .default("60000"),
  RATE_LIMIT_MAX: z
    .string()
    .transform((v) => Number(v))
    .default("100"),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017"),
  MONGODB_DB_NAME: z.string().min(1).default("technical_records"),
  MONGODB_MIN_POOL_SIZE: z.string().transform((v) => Number(v)).default("5"),
  MONGODB_MAX_POOL_SIZE: z.string().transform((v) => Number(v)).default("20"),
  FIELD_ENCRYPTION_KEY: z.string().min(32).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  AUTH_SECRET: z.string().min(16).optional()
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data as unknown as {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  MONGODB_MIN_POOL_SIZE: number;
  MONGODB_MAX_POOL_SIZE: number;
  FIELD_ENCRYPTION_KEY?: string;
  ADMIN_EMAIL?: string;
  AUTH_SECRET?: string;
};
