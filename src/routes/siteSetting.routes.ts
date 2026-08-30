import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getSiteSettings,
  updateSiteSettings,
  upsertSiteSetting,
} from "../controllers/siteSetting.controller";

const router = Router();

// Admin: get all settings
router.get("/", authMiddleware(["admin", "moderator"]), getSiteSettings);

// Admin: bulk update settings
router.put("/", authMiddleware(["admin"]), updateSiteSettings);

// Admin: upsert a single setting
router.post("/", authMiddleware(["admin"]), upsertSiteSetting);

export default router;
