import { Router } from "express";
import cors from "cors";
import * as ctrl from "../controllers/auth.controller";

const router = Router();

// Production-ready CORS configuration for auth routes
const allowedOrigins = [
  // Production frontend (Render deployment)
  "https://abelov-technical-records-main.onrender.com",
  // Development frontend
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:3000",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));

    if (isAllowed) {
      return callback(null, origin);
    }

    return callback(new Error(`CORS policy violation: ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-CSRF-Token"
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

router.use(cors(corsOptions));

router.post("/signup", ctrl.signup);
router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.post("/logout", ctrl.logout);
router.options("/me", cors(corsOptions)); // Handle preflight explicitly
router.get("/me", ctrl.me);

router.options("/profile", cors(corsOptions));
router.put("/profile", ctrl.updateProfile);

export default router;
