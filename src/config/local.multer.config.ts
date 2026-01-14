// src/config/multer.config.ts
import multer from "multer";
import path from "path";
import fs from "fs";

const sanitizeName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-");
};

const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

export const getMulterStorage = (folder: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "../../public/uploads", folder);

      // Ensure folder exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueId = generateUniqueId();
      let fileName;
      if (req.body?.data) {
        const data = JSON.parse(req.body?.data);
        const ext = path.extname(file.originalname);
        const desiredPublicId = data.fullName || path.basename(file.originalname, ext);
        const sanitizedName = sanitizeName(desiredPublicId.toString());
        fileName = `${sanitizedName}-${uniqueId}${ext}`;
      } else {
        const ext = path.extname(file.originalname);
        const sanitizedName = sanitizeName(path.basename(file.originalname, ext));
        fileName = `${sanitizedName}-${uniqueId}${ext}`;
      }
      cb(null, fileName);
    },
  });

// helper to create Multer instance for a specific folder
export const createUploader = (folder: string) => multer({ storage: getMulterStorage(folder) });
