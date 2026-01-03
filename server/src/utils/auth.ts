import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

const SALT_ROUNDS = 12;

export const hashPassword = (password: string) => {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  const hash = bcrypt.hashSync(password, salt);
  return { salt, hash };
};

export const verifyPassword = (password: string, salt: string, hash: string) => {
  // If it's a bcrypt hash (usually starts with $2a$ or $2b$)
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    try {
      return bcrypt.compareSync(password, hash);
    } catch (err) {
      return false;
    }
  }

  // Fallback for legacy PBKDF2 hashes
  if (salt && hash.length === 64) { // PBKDF2 hex hash is 64 chars
    try {
      const computed = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
      return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
    } catch (err) {
      return false;
    }
  }

  return false;
};


const secret = () => {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (env.FIELD_ENCRYPTION_KEY) return env.FIELD_ENCRYPTION_KEY.slice(0, 32);

  if (env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or FIELD_ENCRYPTION_KEY must be set in production");
  }
  return "dev-secret-please-set-at-least-thirty-two-chars";
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

