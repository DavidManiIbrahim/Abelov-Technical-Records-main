import type { Request, Response, NextFunction } from "express";
import { SignupSchema, LoginSchema } from "../types/auth";
import { UserModel } from "../models/user.model";
import { ApiError } from "../middlewares/error";
import { hashPassword, verifyPassword, createToken, verifyToken } from "../utils/auth";

/**
 * Signup - Create new user account
 * RULE: Never save auth tokens to storage; client must login separately
 */
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = SignupSchema.parse(req.body);
    const exists = await UserModel.findOne({ email });
    if (exists) throw new ApiError(409, "Email already registered");
    const { salt, hash } = hashPassword(password);
    const doc = await UserModel.create({
      email,
      roles: role ? [role] : ['user'],
      is_active: true,
      password_hash: hash,
      password_salt: salt
    } as any);
    const user = doc.toJSON() as any;
    // Return user WITHOUT token (client must login separately)
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * Login - Authenticate user and return HTTP-only cookie with JWT
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const doc = await UserModel.findOne({ email });
    if (!doc) throw new ApiError(401, "Invalid credentials");
    const ok = verifyPassword(password, (doc as any).password_salt, (doc as any).password_hash);
    if (!ok) throw new ApiError(401, "Invalid credentials");
    const user = doc.toJSON() as any;
    const token = createToken({ sub: user.id, email: user.email }, 604800);
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // Secure in production (HTTPS)
      sameSite: isProduction ? "none" : "lax", // None for cross-site (required for separate frontend/backend domains in prod)
      maxAge: 604800 * 1000,
      path: "/",
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * Me - Fetch current user from HTTP-only cookie
 * Called by frontend AuthContext on app load to restore session
 * Returns full user object including roles
 */
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;
    const cookies = req.cookies as Record<string, string>;
    if (cookies.token) {
      token = cookies.token;
    } else {
      const auth = req.headers.authorization || "";
      const parts = auth.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }
    if (!token) throw new ApiError(401, "Unauthorized");
    const payload = verifyToken(token);
    if (!payload || typeof payload.sub !== "string") throw new ApiError(401, "Unauthorized");
    const doc = await UserModel.findById(payload.sub);
    if (!doc) throw new ApiError(401, "Unauthorized");
    const user = doc.toJSON() as any;
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout - Clear token cookie
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      path: "/",
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax"
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

