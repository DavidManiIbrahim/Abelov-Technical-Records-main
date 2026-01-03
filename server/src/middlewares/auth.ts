import { Request, Response, NextFunction } from "express";
import { ApiError } from "./error";
import { verifyToken } from "../utils/auth";
import { UserModel } from "../models/user.model";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | null = null;

        // Check cookies first
        const cookies = req.cookies as Record<string, string>;
        if (cookies && cookies.token) {
            token = cookies.token;
        } else {
            // Check Authorization header
            const auth = req.headers.authorization || "";
            const parts = auth.split(" ");
            if (parts.length === 2 && parts[0] === "Bearer") {
                token = parts[1];
            }
        }

        if (!token) {
            return next(new ApiError(401, "Unauthorized - No token provided"));
        }

        const payload = verifyToken(token);
        if (!payload || typeof payload.sub !== "string") {
            return next(new ApiError(401, "Unauthorized - Invalid token"));
        }

        const user = await UserModel.findById(payload.sub);
        if (!user) {
            return next(new ApiError(401, "Unauthorized - User not found"));
        }

        // Attach user to request
        (req as any).user = user;

        next();
    } catch (err) {
        next(new ApiError(401, "Unauthorized"));
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) {
            return next(new ApiError(401, "Unauthorized"));
        }

        const hasRole = roles.some((role) => user.roles.includes(role));
        if (!hasRole) {
            return next(new ApiError(403, "Forbidden - Insufficient permissions"));
        }

        next();
    };
};
