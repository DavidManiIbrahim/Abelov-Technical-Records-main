import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

const SALT_ROUNDS = 12;

export const hashPassword = (password: string) => {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  const hash = bcrypt.hashSync(password, salt);
  return { salt, hash };
};

export const verifyPassword = (password: string, _salt: string, hash: string) => {
  // bcrypt handles the salt internally within the hash string
  return bcrypt.compareSync(password, hash);
};

const secret = () => {
  const val = env.AUTH_SECRET || env.FIELD_ENCRYPTION_KEY;
  if (!val) {
    if (env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET or FIELD_ENCRYPTION_KEY must be set in production");
    }
    return "dev-secret-please-set-at-least-thirty-two-chars";
  }
  return val;
};

export const createToken = (payload: Record<string, unknown>, expiresInSeconds = 3600) => {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = { ...payload, exp };
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = enc(header);
  const bod = enc(body);
  const mac = crypto.createHmac("sha256", secret()).update(`${head}.${bod}`).digest("base64url");
  return `${head}.${bod}.${mac}`;
};

export const verifyToken = (token: string) => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, bod, mac] = parts;

  const expected = crypto.createHmac("sha256", secret()).update(`${head}.${bod}`).digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
    const body = JSON.parse(Buffer.from(bod, "base64url").toString("utf8"));
    if (typeof body.exp !== "number" || body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch (err) {
    return null;
  }
};

