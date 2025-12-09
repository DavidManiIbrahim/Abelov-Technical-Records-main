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

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "ValidationError",
      details: err.errors.map((e) => ({ path: e.path, message: e.message })),
    });
  }
  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({ error: message });
};

