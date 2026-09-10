import { Request, Response } from "express";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file" });

    const result = await uploadToCloudinary(req.file);

    res.json({
      url: result.secure_url || result.url,
      public_id: result.public_id,
      folder: req.query.folder || req.body?.folder || "misc",
    });
  } catch (err: any) {
    console.error("Cloudinary Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

import { v2 as cloudinary } from "cloudinary";
import https from "https";
import http from "http";

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

/**
 * @desc Stream/Proxy PDF documents bypassing Cloudinary delivery restrictions
 * @route GET /api/upload/pdf-view
 */
export const viewPdf = async (req: Request, res: Response) => {
  try {
    const rawUrl = (req.query.url as string) || "";
    let publicId = (req.query.public_id as string) || "";
    const isDownload = req.query.download === "true";
    const filename = (req.query.filename as string) || "document.pdf";

    if (!publicId && rawUrl) {
      const match = rawUrl.match(/\/v\d+\/(.+?)(\.pdf)?$/);
      if (match) {
        publicId = match[1];
      }
    }

    if (publicId) {
      // Generate private signed URL that bypasses Cloudinary PDF restriction
      const downloadUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
        resource_type: "image",
        type: "upload",
      });

      const client = downloadUrl.startsWith("https") ? https : http;
      return client.get(downloadUrl, (cloudRes) => {
        if (cloudRes.statusCode !== 200) {
          // Fallback to raw resource_type if image failed
          const rawDownloadUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
            resource_type: "raw",
            type: "upload",
          });
          return client.get(rawDownloadUrl, (rawRes) => {
            if (rawRes.statusCode !== 200) {
              return res.status(404).json({ message: "PDF document not found in storage" });
            }
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(filename)}"`
            );
            res.setHeader("Cache-Control", "public, max-age=86400");
            rawRes.pipe(res);
          });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(filename)}"`
        );
        res.setHeader("Cache-Control", "public, max-age=86400");
        cloudRes.pipe(res);
      });
    }

    if (rawUrl) {
      const client = rawUrl.startsWith("https") ? https : http;
      return client.get(rawUrl, (externalRes) => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(filename)}"`
        );
        externalRes.pipe(res);
      });
    }

    return res.status(400).json({ message: "Missing url or public_id parameter" });
  } catch (err: any) {
    console.error("PDF View error:", err);
    res.status(500).json({ message: "Failed to load PDF", error: err.message });
  }
};
