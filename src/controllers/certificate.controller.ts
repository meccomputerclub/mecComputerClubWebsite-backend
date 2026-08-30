import { Request, Response, NextFunction } from "express";
import { Certificate } from "../models/Certificate.model";
import User from "../models/User.model";

/**
 * @desc  Verify a certificate by its unique certificateId
 * @route GET /api/certificates/verify/:certificateId
 * @access Public
 */
export const verifyCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({ certificateId })
      .populate("recipient", "fullName email studentId department batch imageUrl")
      .populate("associatedEvent", "title date location")
      .lean();

    if (!cert) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Certificate not found. The ID may be invalid or the certificate may have been revoked.",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: "Certificate is valid.",
      data: {
        certificateId: cert.certificateId,
        name: cert.name,
        description: cert.description,
        issueDate: cert.issueDate,
        digitalUrl: cert.digitalUrl,
        recipient: cert.recipient,
        associatedEvent: cert.associatedEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get all certificates for a user
 * @route GET /api/certificates/user/:userId
 * @access Public
 */
export const getUserCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const certs = await Certificate.find({ recipient: userId })
      .populate("associatedEvent", "title date")
      .sort({ issueDate: -1 })
      .lean();

    res.status(200).json({ success: true, data: certs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Create a certificate (admin)
 * @route POST /api/certificates
 * @access Admin
 */
export const createCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, recipientId, associatedEventId, issueDate, certificateId, digitalUrl } = req.body;

    if (!name || !recipientId || !issueDate || !certificateId || !digitalUrl) {
      return res.status(400).json({ success: false, message: "name, recipientId, issueDate, certificateId, and digitalUrl are required." });
    }

    // Check recipient exists
    const user = await User.findById(recipientId);
    if (!user) return res.status(404).json({ success: false, message: "Recipient user not found." });

    // Check unique certificateId
    const existing = await Certificate.findOne({ certificateId });
    if (existing) return res.status(400).json({ success: false, message: "Certificate ID already exists." });

    const cert = await Certificate.create({
      name,
      description,
      recipient: recipientId,
      associatedEvent: associatedEventId || undefined,
      issueDate: new Date(issueDate),
      certificateId,
      digitalUrl,
    });

    res.status(201).json({ success: true, message: "Certificate created.", data: cert });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  List all certificates (admin)
 * @route GET /api/certificates
 * @access Admin
 */
export const listCertificates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [certs, total] = await Promise.all([
      Certificate.find()
        .populate("recipient", "fullName email studentId")
        .populate("associatedEvent", "title date")
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Certificate.countDocuments(),
    ]);

    res.status(200).json({ success: true, data: certs, total, page, limit });
  } catch (error) {
    next(error);
  }
};
