// src/routes/upload.routes.ts
import { Router } from "express";
import { createUploader } from "../config/multer.config";
import { uploadImage } from "../controllers/upload.controller";

const router = Router();
const upload = createUploader("misc");
router.post("/image", upload.single("image"), uploadImage);

export default router;
