import fs from "fs/promises";
import path from "path";
import { IUploadResult } from "../types/upload.types";

const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

// NEW: Local upload service (matches Cloudinary return structure)
export const uploadToServer = async (
  file: Express.Multer.File,
  folder: string = "misc",
  publicId?: string
): Promise<IUploadResult> => {
  return {
    asset_id: generateUniqueId(),
    public_id: publicId ? `${publicId}-${generateUniqueId()}` : file.filename,
    url: `/uploads/${folder}/${file.filename}`,
    secure_url: `/uploads/${folder}/${file.filename}`,
    original_filename: file.originalname,
    bytes: file.size,
    format: path.extname(file.filename).substring(1),
  };
};

export const deleteFromServer = async (publicUrl: string): Promise<void> => {
  const relativePath = publicUrl.startsWith("/") ? publicUrl.substring(1) : publicUrl;
  const absolutePath = path.join(__dirname, "../../public", relativePath);

  try {
    await fs.access(absolutePath);
    await fs.unlink(absolutePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return;
    }
    throw new Error(`Local file deletion failed: ${error.message}`);
  }
};
