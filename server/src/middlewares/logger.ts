import pino from "pino";
import { pinoHttp } from "pino-http";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: undefined,
});

export const httpLogger = pinoHttp();
