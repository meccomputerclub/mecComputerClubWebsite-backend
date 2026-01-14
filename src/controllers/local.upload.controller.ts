// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import { uploadToServer } from "../services/upload.service";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file" });

    const folder = (req.query.folder as string) || "misc";

    const prefix = (req.query.prefix as string) || "";

    let publicId: string | undefined = undefined;

    if (prefix) {
      const sanitizedPrefix = prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const originalName = req.file.originalname.replace(/\.[^/.]+$/, "");
      const sanitizedName = originalName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      publicId = `${sanitizedPrefix}_${sanitizedName}`;
    }

    // Now upload using local server service
    const result = await uploadToServer(req.file, folder, publicId);

    res.json({
      url: result.secure_url, // points to /uploads/filename
      public_id: result.public_id,
      folder,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};
