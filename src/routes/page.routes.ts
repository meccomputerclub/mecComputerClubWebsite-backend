import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getHomePage, updateHomePage, patchHomePage } from "../controllers/page.controller";
const router = Router();

router.get("/", getHomePage);
router.post("/", authMiddleware(["admin", "moderator"]), updateHomePage);
router.put("/", authMiddleware(["admin", "moderator"]), updateHomePage);
router.patch("/", authMiddleware(["admin", "moderator"]), patchHomePage);

export default router;
