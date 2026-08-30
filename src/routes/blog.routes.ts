import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog } from "../controllers/blog.controller";

const router = Router();

router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.post("/", authMiddleware(["admin", "moderator"]), createBlog);
router.patch("/:id", authMiddleware(["admin", "moderator"]), updateBlog);
router.delete("/:id", authMiddleware(["admin", "moderator"]), deleteBlog);

export default router;
