import express from "express";
import * as designationCtrl from "../controllers/designation.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

// Public: Fetch all active designations (sorted by precedence order)
router.get("/", designationCtrl.getDesignations);

// Admin / Executive management routes
router.post(
  "/",
  authMiddleware(["admin", "moderator", "executive"]),
  designationCtrl.createDesignation
);

router.patch(
  "/reorder",
  authMiddleware(["admin", "moderator", "executive"]),
  designationCtrl.reorderDesignations
);

router.patch(
  "/:id",
  authMiddleware(["admin", "moderator", "executive"]),
  designationCtrl.updateDesignation
);

router.delete(
  "/:id",
  authMiddleware(["admin", "moderator", "executive"]),
  designationCtrl.deleteDesignation
);

router.post(
  "/:id/assign-members",
  authMiddleware(["admin", "moderator", "executive"]),
  designationCtrl.assignMembersToDesignation
);

export default router;
