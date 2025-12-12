import crypto from "crypto";
import { env } from "../config/env";

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return { salt, hash };
};

export const verifyPassword = (password: string, salt: string, hash: string) => {
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
};

const secret = () => (env.AUTH_SECRET || (env.FIELD_ENCRYPTION_KEY || "").slice(0, 32) || "dev-secret-please-set");

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
  const [head, bod, mac] = token.split(".");
  if (!head || !bod || !mac) return null;
  const expected = crypto.createHmac("sha256", secret()).update(`${head}.${bod}`).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const body = JSON.parse(Buffer.from(bod, "base64url").toString("utf8"));
  if (typeof body.exp !== "number" || body.exp < Math.floor(Date.now() / 1000)) return null;
  return body;
};
