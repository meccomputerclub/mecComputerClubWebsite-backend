import { Router } from "express";
import {
  searchCourses,
  submitCourse,
  getAllCourses,
  updateCourseStatus,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Public search for auto-suggest
router.get("/search", searchCourses);

// User submission from cover-page generator (optional auth)
router.post("/submit", optionalAuthMiddleware, submitCourse);

// Admin / Moderator / Executive management
router.get("/", authMiddleware(["admin", "moderator", "executive"]), getAllCourses);
router.patch("/:id/status", authMiddleware(["admin", "moderator", "executive"]), updateCourseStatus);
router.patch("/:id", authMiddleware(["admin", "moderator", "executive"]), updateCourse);
router.delete("/:id", authMiddleware(["admin", "moderator", "executive"]), deleteCourse);

export default router;
