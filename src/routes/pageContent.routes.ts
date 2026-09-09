import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getPageContent, updatePageContent } from "../controllers/pageContent.controller";

const router = Router();

// Public: fetch page content sections
router.get("/:page", getPageContent);

// Protected: update page content sections (admin & moderator)
router.put("/:page", authMiddleware(["admin", "moderator"]), updatePageContent);

export default router;
