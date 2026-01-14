import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getHomePage, updateHomePage } from "../controllers/page.controller";
const router = Router();

router.get("/", getHomePage);
router.post("/", authMiddleware(["admin", "moderator"]), updateHomePage);

export default router;
