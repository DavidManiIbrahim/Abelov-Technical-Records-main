import { Router } from "express";
import cors from "cors";
import * as ctrl from "../controllers/auth.controller";

const router = Router();

// Apply CORS specifically to auth routes as backup
const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
};

router.use(cors(corsOptions));

router.post("/signup", ctrl.signup);
router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", ctrl.me);

export default router;
