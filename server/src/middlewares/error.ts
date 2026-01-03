import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      details: err.errors.map((e) => ({ path: e.path, message: e.message })),
    });
  }

  // Handle Custom API Errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Handle MongoDB Duplicate Key Errors (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      error: "Conflict",
      message: `A record with this ${field} already exists.`,
    });
  }

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Database Validation Error",
      message: err.message,
    });
  }

  // Fallback for everything else
  const message = err instanceof Error ? err.message : "Internal Server Error";
  const statusCode = (err as any).statusCode || 500;

  res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : message,
  });
};

