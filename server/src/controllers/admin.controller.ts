import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../middlewares/error";
import { ensureAdminWithSampleRequest } from "../services/admin.service";
import { RequestModel } from "../models/request.model";
import { UserModel } from "../models/user.model";

export const initAdmin = async (_req: Request, res: Response) => {
  const result = await ensureAdminWithSampleRequest();
  const status = result.adminCreated || result.requestCreated ? 201 : 200;
  res.status(status).json({ admin: result.admin, request: result.request });
};

export const getGlobalStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get total users from User model
    const totalUsers = await UserModel.countDocuments();

    const totalTickets = await RequestModel.countDocuments();
    const pendingTickets = await RequestModel.countDocuments({ status: "Pending" });
    const inProgressTickets = await RequestModel.countDocuments({ status: "In-Progress" });
    const completedTickets = await RequestModel.countDocuments({ status: "Completed" });
    const onHoldTickets = await RequestModel.countDocuments({ status: "On-Hold" });

    const requests = await RequestModel.find();
    const totalRevenue = requests.reduce((sum: number, r: any) => sum + (r.total_cost || 0), 0);

    res.json({
      totalUsers,
      totalTickets,
      pendingTickets,
      completedTickets,
      inProgressTickets,
      onHoldTickets,
      totalRevenue,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all users from the User model
    const users = await UserModel.find({}, 'id email roles is_active created_at');
    const userStats = await Promise.all(
      users.map(async (user: any) => ({
        id: user.id,
        email: user.email,
        full_name: null, // Not stored in user model currently
        company_name: null, // Not stored in user model currently
        is_active: user.is_active,
        created_at: user.created_at,
        ticketCount: await RequestModel.countDocuments({ user_id: user.id }),
        totalRevenue: await RequestModel.aggregate([
          { $match: { user_id: user.id } },
          { $group: { _id: null, total: { $sum: '$total_cost' } } }
        ]).then(result => result[0]?.total || 0),
        pendingTickets: await RequestModel.countDocuments({ user_id: user.id, status: "Pending" }),
        completedTickets: await RequestModel.countDocuments({ user_id: user.id, status: "Completed" }),
        lastActivityDate: await RequestModel.findOne({ user_id: user.id }, {}, { sort: { updated_at: -1 } }).then(doc => doc?.updated_at || null),
      }))
    );
    res.json({ data: userStats });
  } catch (err) {
    next(err);
  }
};

export const getAllRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 1000);
    const offsetNum = parseInt(offset as string) || 0;

    const filter: any = {};
    if (status) filter.status = status;

    const total = await RequestModel.countDocuments(filter);
    const requests = await RequestModel.find(filter)
      .sort({ created_at: -1 })
      .limit(limitNum)
      .skip(offsetNum);

    res.json({ 
      data: requests,
      total,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (err) {
    next(err);
  }
};

export const searchRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    const query = q as string;
    if (!query) {
      return res.json({ data: [], total: 0 });
    }

    const limitNum = Math.min(parseInt(limit as string) || 50, 1000);
    const offsetNum = parseInt(offset as string) || 0;

    const searchFilter = {
      $or: [
        { customer_name: { $regex: query, $options: "i" } },
        { customer_phone: { $regex: query, $options: "i" } },
        { customer_email: { $regex: query, $options: "i" } },
        { device_serial: { $regex: query, $options: "i" } },
      ],
    };

    const total = await RequestModel.countDocuments(searchFilter);
    const requests = await RequestModel.find(searchFilter)
      .sort({ created_at: -1 })
      .limit(limitNum)
      .skip(offsetNum);

    res.json({ 
      data: requests,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 1000);
    const offsetNum = parseInt(offset as string) || 0;

    // Return recent requests as activity logs
    const logs = await RequestModel.find()
      .sort({ updated_at: -1 })
      .limit(limitNum)
      .skip(offsetNum)
      .select("user_id customer_name status created_at updated_at");

    const total = await RequestModel.countDocuments();

    res.json({
      data: logs.map((log: any) => ({
        id: log._id,
        user: log.user_id,
        action: "request_update",
        resource: `Request: ${log.customer_name}`,
        status: log.status,
        timestamp: log.updated_at,
      })),
      total,
    });
  } catch (err) {
    next(err);
  }
};

