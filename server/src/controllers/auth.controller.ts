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
    // Return token in body as well for localStorage fallback
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
};

/**
 * Me - Fetch current user
 * Returns full user object from req.user (attached by authenticate middleware)
 */
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) throw new ApiError(401, "Unauthorized");
    res.json({ user: user.toJSON() });
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

/**
 * Update Profile - Update user's profile information (username, image)
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRequest = (req as any).user;
    if (!userRequest) throw new ApiError(401, "Unauthorized");

    const { username, profile_image } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      userRequest.id,
      {
        ...(username !== undefined && { username }),
        ...(profile_image !== undefined && { profile_image })
      },
      { new: true }
    );

    if (!user) throw new ApiError(404, "User not found");

    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

