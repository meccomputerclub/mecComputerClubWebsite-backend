import { Router } from "express";
import {
  createInvitationCode,
  verifyInvitationCode,
  consumeInvitationCode,
  cancelInvitationCode,
  updateInvitationStatus,
  getCodeInfo,
  getAllInvitationCodes,
  deleteInvitationCode,
  resendInvitationCode,
} from "../controllers/invitationCode.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Client (Public)
router.get("/", getCodeInfo);
router.post("/verify", verifyInvitationCode);
router.post("/consume", consumeInvitationCode);

// Admin & Moderator (Protected)
router.get("/list", authMiddleware(["admin", "moderator"]), getAllInvitationCodes);
router.get("/all", authMiddleware(["admin", "moderator"]), getAllInvitationCodes);
router.post("/create", authMiddleware(["admin", "moderator"]), createInvitationCode);
router.patch("/status", authMiddleware(["admin", "moderator"]), updateInvitationStatus);
router.post("/status", authMiddleware(["admin", "moderator"]), updateInvitationStatus);
router.post("/cancel", authMiddleware(["admin", "moderator"]), cancelInvitationCode);
router.post("/resend", authMiddleware(["admin", "moderator"]), resendInvitationCode);
router.delete("/:id", authMiddleware(["admin", "moderator"]), deleteInvitationCode);
router.delete("/", authMiddleware(["admin", "moderator"]), deleteInvitationCode);

export default router;
