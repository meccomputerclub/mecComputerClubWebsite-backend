import { Router } from "express";
import {
  createInvitationCode,
  verifyInvitationCode,
  consumeInvitationCode,
  cancelInvitationCode,
  getCodeInfo,
} from "../controllers/invitationCode.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Client
router.get("/", getCodeInfo);
router.post("/verify", verifyInvitationCode);
router.post("/consume", consumeInvitationCode);
// Admin
router.post("/create", authMiddleware(["admin", "moderator"]), createInvitationCode);
router.post("/cancel", authMiddleware(["admin", "moderator"]), cancelInvitationCode);

export default router;
