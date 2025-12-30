import { Router } from "express";
import * as ctrl from "../controllers/requests.controller";

const router = Router();

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.get("/stats/:userId", ctrl.getStats);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.update);
router.post("/:id/payment", ctrl.recordPayment);
router.delete("/:id", ctrl.remove);

export default router;

