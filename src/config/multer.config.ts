import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";

// Configure Cloudinary with credentials from env variables
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
        try {
          const data = JSON.parse(req.body.data);
          desiredName = data.fullName || desiredName;
        } catch {
          // fallback to original name
        }
      }

      return {
        folder: `uploads/${folder}`,
        public_id: `${sanitizeName(desiredName)}-${Date.now()}`,
        allowed_formats: ["jpg", "png", "jpeg", "webp", "gif", "svg"],
      };
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB limit
    },
  });
};

export const createFileUploader = (folder: string) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let desiredName = path.parse(file.originalname).name;

      return {
        folder: `uploads/${folder}`,
        resource_type: "auto",
        public_id: `${sanitizeName(desiredName)}-${Date.now()}`,
      };
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
    },
  });
};
