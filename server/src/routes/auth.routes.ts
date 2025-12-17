import { Router } from "express";
import * as ctrl from "../controllers/auth.controller";

const router = Router();

router.post("/signup", ctrl.signup);
router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", ctrl.me);

export default router;
