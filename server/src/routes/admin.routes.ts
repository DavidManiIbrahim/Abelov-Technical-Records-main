import { Router } from "express";
import * as ctrl from "../controllers/admin.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// Apply authentication and admin authorization to all admin routes
router.use(authenticate);
router.use(authorize(["admin"]));

router.post("/init", ctrl.initAdmin);
router.get("/stats", ctrl.getGlobalStats);
router.get("/users", ctrl.getAllUsers);
router.post("/users", ctrl.createUser);
router.delete("/users/:id", ctrl.deleteUser);
router.get("/logs", ctrl.getActivityLogs);
router.get("/requests/search", ctrl.searchRequests);
router.get("/requests", ctrl.getAllRequests);


export default router;

