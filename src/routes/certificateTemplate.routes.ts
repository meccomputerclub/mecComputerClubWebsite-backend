import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from "../controllers/certificateTemplate.controller";

const router = Router();

// Public / Authenticated: list all certificate templates
router.get("/", listTemplates);

// Public / Authenticated: get template by ID
router.get("/:id", getTemplateById);

// Admin/Executive: create template
router.post("/", authMiddleware(["admin", "moderator", "executive"]), createTemplate);

// Admin/Executive: update template
router.put("/:id", authMiddleware(["admin", "moderator", "executive"]), updateTemplate);

// Admin/Executive: set template as default
router.patch("/:id/default", authMiddleware(["admin", "moderator", "executive"]), setDefaultTemplate);

// Admin: delete template
router.delete("/:id", authMiddleware(["admin"]), deleteTemplate);

export default router;
