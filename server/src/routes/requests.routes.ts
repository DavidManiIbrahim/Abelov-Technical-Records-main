import { Router } from "express";
import * as ctrl from "../controllers/requests.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Public routes (No authentication required)
router.get("/public/:id", ctrl.getPublicById);
router.post("/public/:id/payment", ctrl.recordPayment);

// Apply authentication middleware to all subsequent routes
router.use(authenticate);



router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.get("/stats/:userId", ctrl.getStats);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.update);
router.post("/:id/payment", ctrl.recordPayment);
router.delete("/:id", ctrl.remove);

export default router;

