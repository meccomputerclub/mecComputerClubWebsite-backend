// routes/event.routes.ts
import { Router } from "express";
import {
  handleCreateEvent,
  handleGetEvents,
  handleGetEventById,
  handleUpdateEvent,
  handleDeleteEvent,
} from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware(["admin", "moderator"]), handleCreateEvent);
router.get("/", handleGetEvents);
router.get("/:id", handleGetEventById);
router.patch("/:id", authMiddleware(["admin", "moderator"]), handleUpdateEvent);
router.delete("/:id", authMiddleware(["admin", "moderator"]), handleDeleteEvent);

export default router;
