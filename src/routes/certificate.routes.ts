import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  verifyCertificate,
  getUserCertificates,
  createCertificate,
  listCertificates,
} from "../controllers/certificate.controller";

const router = Router();

// Public: verify a certificate by ID
router.get("/verify/:certificateId", verifyCertificate);

// Public: get all certificates for a user
router.get("/user/:userId", getUserCertificates);

// Admin: list all certificates
router.get("/", authMiddleware(["admin", "moderator"]), listCertificates);

// Admin: create a certificate
router.post("/", authMiddleware(["admin", "moderator"]), createCertificate);

export default router;
