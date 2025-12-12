import { Router } from "express";
import * as ctrl from "../controllers/admin.controller";

const router = Router();

router.post("/init", ctrl.initAdmin);
router.get("/stats", ctrl.getGlobalStats);
router.get("/users", ctrl.getAllUsers);
router.get("/logs", ctrl.getActivityLogs);
router.get("/requests/search", ctrl.searchRequests);
router.get("/requests", ctrl.getAllRequests);

export default router;

