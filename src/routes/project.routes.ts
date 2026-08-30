import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createProject, getAllProjects, getProjectById, updateProject, deleteProject } from "../controllers/project.controller";

const router = Router();

router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.post("/", authMiddleware(["admin", "moderator"]), createProject);
router.patch("/:id", authMiddleware(["admin", "moderator"]), updateProject);
router.delete("/:id", authMiddleware(["admin", "moderator"]), deleteProject);

export default router;
