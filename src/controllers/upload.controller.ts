import { Request, Response } from "express";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file" });

    const result = await uploadToCloudinary(req.file);

    res.json({
      url: result.secure_url || result.url,
      public_id: result.public_id,
      folder: req.query.folder || "misc",
    });
  } catch (err: any) {
    console.error("Cloudinary Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ message: "public_id is required" });
    }
    await deleteFromCloudinary(public_id);
    res.json({ success: true, message: "Image deleted from Cloudinary." });
  } catch (err: any) {
    console.error("Cloudinary Delete error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};
