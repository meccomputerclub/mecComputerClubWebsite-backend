import { Request, Response } from "express";
import { uploadToCloudinary } from "../services/upload.service";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file" });

    // Format the already-uploaded file data using our service
    const result = await uploadToCloudinary(req.file);

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      folder: req.query.folder || "misc",
    });
  } catch (err: any) {
    console.error("Cloudinary Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
