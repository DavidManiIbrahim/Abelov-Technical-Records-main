import express from "express";
import cookieParser from "cookie-parser";
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
  app.set("trust proxy", 1); // Trust first proxy (Render load balancer)

  app.use(httpLogger);
  app.use(helmet());

  // Production-ready CORS configuration
  const allowedOrigins = [
    // Production frontend (Render deployment)
    "https://abelov-technical-records-main.onrender.com",
    "https://abelov-technical-records.onrender.com",
    // Development frontend
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  // CORS middleware with proper credentials handling
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl, etc.)
        if (!origin) return callback(null, true);

        // Check against allowed origins
        const isAllowed = allowedOrigins.includes(origin) ||
          (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));

        if (isAllowed) {
          // Return the specific origin, not true, when credentials are enabled
          return callback(null, origin);
        }

        // Reject other origins
        return callback(new Error(`CORS policy violation: ${origin} not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-CSRF-Token"
      ],
      optionsSuccessStatus: 200,
      preflightContinue: false,
    })
  );

  // Global OPTIONS handler as backup
  app.options('*', (req, res) => {
    const origin = req.headers.origin;
    const isAllowed = !origin ||
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));

    if (isAllowed) {
      // Only set origin header if we have a specific origin
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.sendStatus(200);
    } else {
      res.sendStatus(403);
    }
  });
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
