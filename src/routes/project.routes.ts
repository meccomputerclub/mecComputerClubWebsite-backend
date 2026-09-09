import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
  proposeProject,
  toggleFeaturedProject,
} from "../controllers/project.controller";

const router = Router();

router.get("/my-projects", authMiddleware(), getMyProjects);
router.post("/propose", authMiddleware(), proposeProject);
router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.post("/", authMiddleware(), createProject);
router.patch("/:id/featured", authMiddleware(["admin", "moderator"]), toggleFeaturedProject);
router.patch("/:id", authMiddleware(), updateProject);
router.delete("/:id", authMiddleware(), deleteProject);

export default router;
