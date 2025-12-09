import type { Request, Response } from "express";
import { ensureAdminWithSampleRequest } from "../services/admin.service";

export const initAdmin = async (_req: Request, res: Response) => {
  const result = await ensureAdminWithSampleRequest();
  const status = result.adminCreated || result.requestCreated ? 201 : 200;
  res.status(status).json({ admin: result.admin, request: result.request });
};

