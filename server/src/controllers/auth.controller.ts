import type { Request, Response, NextFunction } from "express";
import { SignupSchema, LoginSchema } from "../types/auth";
import { UserModel } from "../models/user.model";
import { ApiError } from "../middlewares/error";
import { hashPassword, verifyPassword, createToken } from "../utils/auth";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = SignupSchema.parse(req.body);
    const exists = await UserModel.findOne({ email });
    if (exists) throw new ApiError(409, "Email already registered");
    const { salt, hash } = hashPassword(password);
    const doc = await UserModel.create({ email, roles: role ? [role] : [], is_active: true, password_hash: hash, password_salt: salt } as any);
    const user = doc.toJSON() as any;
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const doc = await UserModel.findOne({ email });
    if (!doc) throw new ApiError(401, "Invalid credentials");
    const ok = verifyPassword(password, (doc as any).password_salt, (doc as any).password_hash);
    if (!ok) throw new ApiError(401, "Invalid credentials");
    const user = doc.toJSON() as any;
    const token = createToken({ sub: user.id, email: user.email }, 3600);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
};

