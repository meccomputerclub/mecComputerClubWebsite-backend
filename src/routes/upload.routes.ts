// src/routes/upload.routes.ts
import { Router } from "express";
import { createUploader, createFileUploader } from "../config/multer.config";
import { uploadImage, deleteImage } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const imageUpload = createUploader("forms");
const fileUpload = createFileUploader("form_attachments");

router.post("/image", imageUpload.single("image"), uploadImage);
router.post("/file", fileUpload.single("file"), uploadImage);
router.delete("/image", authMiddleware(), deleteImage);

export default router;
