import type { RequestHandler } from "express";
import { ZodSchema } from "zod";

export const validateBody = <T>(schema: ZodSchema<T>): RequestHandler => {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req.body);
      // overwrite body with parsed result for type-safety downstream
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).body = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
};

