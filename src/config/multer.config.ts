import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";

// Configure Cloudinary with your credentials (use .env variables!)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sanitizeName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-");
};

export const createUploader = (folder: string) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      // Determine the filename (public_id)
      let desiredName = path.parse(file.originalname).name;

      if (req.body?.data) {
        const data = JSON.parse(req.body.data);
        desiredName = data.fullName || desiredName;
      }

      return {
        folder: `uploads/${folder}`,
        public_id: `${sanitizeName(desiredName)}-${Date.now()}`,
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
      };
    },
  });

  return multer({ storage });
};
