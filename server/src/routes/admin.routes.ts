import { Router } from "express";
import * as ctrl from "../controllers/admin.controller";

const router = Router();

router.post("/init", ctrl.initAdmin);

export default router;

