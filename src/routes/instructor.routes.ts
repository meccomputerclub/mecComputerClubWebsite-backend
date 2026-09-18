import { Router } from "express";
import {
  searchInstructors,
  submitInstructor,
  getAllInstructors,
  updateInstructorStatus,
  updateInstructor,
  deleteInstructor,
} from "../controllers/instructor.controller";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Public search for auto-suggest
router.get("/search", searchInstructors);

// User submission from cover-page generator (optional auth)
router.post("/submit", optionalAuthMiddleware, submitInstructor);

// Admin / Moderator / Executive management
router.get("/", authMiddleware(["admin", "moderator", "executive"]), getAllInstructors);
router.patch("/:id/status", authMiddleware(["admin", "moderator", "executive"]), updateInstructorStatus);
router.patch("/:id", authMiddleware(["admin", "moderator", "executive"]), updateInstructor);
router.delete("/:id", authMiddleware(["admin", "moderator", "executive"]), deleteInstructor);

export default router;
