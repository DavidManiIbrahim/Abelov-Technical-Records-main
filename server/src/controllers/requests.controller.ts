import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../middlewares/error";
import { RequestSchema, RequestUpdateSchema } from "../types/request";
import { RequestModel } from "../models/request.model";
import {
  listRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  recordPayment as recordPaymentService,
} from "../services/requests.service";

export const getAll = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isAdmin = user.roles.includes("admin");

  const data = await RequestModel.find(isAdmin ? {} : { user_id: user.id })
    .sort({ created_at: -1 });

  res.json({ data: data.map(d => (d as any).toJSON()) });
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = (req as any).user;
  const isAdmin = user.roles.includes("admin");

  const entity = await RequestModel.findById(id);
  if (!entity) return next(new ApiError(404, "Request not found"));

  if (!isAdmin && entity.user_id !== user.id.toString()) {
    return next(new ApiError(403, "Forbidden - Access denied to this request"));
  }

  res.json({ data: (entity as any).toJSON() });
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const parsed = RequestSchema.parse(req.body);

    // Force user_id to be the authenticated user
    const entity = await createRequest({
      ...parsed,
      user_id: user.id
    } as any);

    res.status(201).json({ data: entity });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const isAdmin = user.roles.includes("admin");

    const existing = await RequestModel.findById(id);
    if (!existing) return next(new ApiError(404, "Request not found"));

    if (!isAdmin && existing.user_id !== user.id.toString()) {
      return next(new ApiError(403, "Forbidden - Access denied"));
    }

    const parsed = RequestUpdateSchema.parse(req.body);

    // Prevent changing user_id through update
    delete (parsed as any).user_id;

    const entity = await updateRequest(id, parsed);
    res.json({ data: entity });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = (req as any).user;
  const isAdmin = user.roles.includes("admin");

  const existing = await RequestModel.findById(id);
  if (!existing) return next(new ApiError(404, "Request not found"));

  if (!isAdmin && existing.user_id !== user.id.toString()) {
    return next(new ApiError(403, "Forbidden"));
  }

  const ok = await deleteRequest(id);
  res.status(204).send();
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const isAdmin = user.roles.includes("admin");

    const existing = await RequestModel.findById(id);
    if (!existing) return next(new ApiError(404, "Request not found"));

    if (!isAdmin && existing.user_id !== user.id.toString()) {
      return next(new ApiError(403, "Forbidden"));
    }

    const { amount, reference } = req.body;
    const entity = await recordPaymentService(id, amount, reference);
    res.json({ data: entity });
  } catch (err) {
    next(err);
  }
};


export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const requests = await RequestModel.find({ user_id: userId });

    const stats = {
      total: requests.length,
      pending: requests.filter((r: any) => r.status === "Pending").length,
      completed: requests.filter((r: any) => r.status === "Completed").length,
      inProgress: requests.filter((r: any) => r.status === "In-Progress").length,
      onHold: requests.filter((r: any) => r.status === "On-Hold").length,
      totalRevenue: requests.reduce((sum: number, r: any) => sum + (r.total_cost || 0), 0),
    };

    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};
