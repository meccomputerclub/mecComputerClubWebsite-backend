import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getSiteSettings,
  getPublicBatchSettings,
  updateSiteSettings,
  upsertSiteSetting,
} from "../controllers/siteSetting.controller";

const router = Router();

// Public: get only batch settings (no auth — needed by registration form)
router.get("/public", getPublicBatchSettings);

// Admin: get all settings
router.get("/", authMiddleware(["admin", "moderator"]), getSiteSettings);

// Admin: bulk update settings
router.put("/", authMiddleware(["admin"]), updateSiteSettings);

// Admin: upsert a single setting
router.post("/", authMiddleware(["admin"]), upsertSiteSetting);

export default router;
