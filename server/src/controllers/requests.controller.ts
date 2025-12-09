import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../middlewares/error";
import { RequestSchema, RequestUpdateSchema } from "../types/request";
import {
  listRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
} from "../services/requests.service";

export const getAll = async (_req: Request, res: Response) => {
  const data = await listRequests();
  res.json({ data });
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const entity = await getRequestById(id);
  if (!entity) return next(new ApiError(404, "Request not found"));
  res.json({ data: entity });
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RequestSchema.parse(req.body);
    const entity = await createRequest(parsed);
    res.status(201).json({ data: entity });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = RequestUpdateSchema.parse(req.body);
    const entity = await updateRequest(id, parsed);
    if (!entity) return next(new ApiError(404, "Request not found"));
    res.json({ data: entity });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const ok = await deleteRequest(id);
  if (!ok) return next(new ApiError(404, "Request not found"));
  res.status(204).send();
};
