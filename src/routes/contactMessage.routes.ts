import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  markMessageRead,
  replyToMessage,
  deleteContactMessage,
} from "../controllers/contactMessage.controller";

const router = Router();

// Public: submit a contact message
router.post("/", createContactMessage);

// Admin: list all messages
router.get("/", authMiddleware(["admin", "moderator"]), getContactMessages);

// Admin: get single message
router.get("/:id", authMiddleware(["admin", "moderator"]), getContactMessageById);

// Admin: mark as read
router.patch("/:id/read", authMiddleware(["admin", "moderator"]), markMessageRead);

// Admin: reply to a message (saves to DB + sends email)
router.post("/:id/reply", authMiddleware(["admin", "moderator"]), replyToMessage);

// Admin: delete a message
router.delete("/:id", authMiddleware(["admin", "moderator"]), deleteContactMessage);

export default router;
