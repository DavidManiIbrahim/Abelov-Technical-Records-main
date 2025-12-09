import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { connectMongo, mongoState } from "./db/mongo";
import { httpLogger } from "./middlewares/logger";
import { apiRateLimiter } from "./middlewares/rateLimit";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error";
import { swaggerSpec } from "./docs/swagger";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(httpLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), version: "1.0.0", db: mongoState() });
  });

  app.use("/api", apiRateLimiter);
  app.use("/api/v1", apiRoutes);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
