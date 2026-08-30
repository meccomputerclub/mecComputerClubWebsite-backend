import { Request, Response, NextFunction } from "express";
import { Sponsor } from "../models/Sponsor.model";
import { uploadToCloudinary } from "../services/upload.service";

export const createSponsor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let logoUrl = req.body.logoUrl;
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      logoUrl = result.url;
    }
    const { name, website, isActive, contactName, contactEmail, sponsorships } = req.body;
    const sponsor = await Sponsor.create({
      name, website, isActive, contactName, contactEmail, logoUrl,
      sponsorships: typeof sponsorships === "string" ? JSON.parse(sponsorships) : (sponsorships || []),
    });
    res.status(201).json({ success: true, data: sponsor });
  } catch (error) { next(error); }
};

export const getAllSponsors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, any> = {};
    if (req.query.active === "true") filter.isActive = true;
    const sponsors = await Sponsor.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: sponsors });
  } catch (error) { next(error); }
};

export const getSponsorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id).lean();
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });
    res.status(200).json({ success: true, data: sponsor });
  } catch (error) { next(error); }
};

export const updateSponsor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const update: Record<string, any> = { ...req.body };
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      update.logoUrl = result.url;
    }
    if (typeof update.sponsorships === "string") {
      update.sponsorships = JSON.parse(update.sponsorships);
    }
    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, update, {
      new: true, runValidators: true,
    });
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });
    res.status(200).json({ success: true, data: sponsor });
  } catch (error) { next(error); }
};

export const addSponsorshipRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await Sponsor.findByIdAndUpdate(
      req.params.id,
      { $push: { sponsorships: req.body } },
      { new: true, runValidators: true }
    );
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });
    res.status(200).json({ success: true, data: sponsor });
  } catch (error) { next(error); }
};

export const deleteSponsor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });
    res.status(200).json({ success: true, message: "Sponsor deleted" });
  } catch (error) { next(error); }
};
