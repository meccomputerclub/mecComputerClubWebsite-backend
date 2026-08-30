import { Request, Response, NextFunction } from "express";
import SiteSetting from "../models/SiteSetting.model";

// Default settings seeded when none exist
const DEFAULT_SETTINGS = [
  { key: "club_name", value: "MEC Computer Club", label: "Club Name", description: "Official name displayed site-wide." },
  { key: "club_tagline", value: "Learn. Build. Share.", label: "Club Tagline", description: "Short tagline shown in the hero section." },
  { key: "contact_email", value: "meccomputerclub@gmail.com", label: "Contact Email", description: "Primary contact email shown on the website." },
  { key: "contact_phone", value: "+8801780667954", label: "Contact Phone", description: "Primary phone number shown on the website." },
  { key: "whatsapp_number", value: "8801780667954", label: "WhatsApp Number", description: "WhatsApp number (digits only, no +)." },
  { key: "facebook_url", value: "https://www.facebook.com/mec.programmingclub", label: "Facebook URL", description: "Club Facebook page URL." },
  { key: "linkedin_url", value: "https://www.linkedin.com/in/mec-computer-club/", label: "LinkedIn URL", description: "Club LinkedIn page URL." },
  { key: "youtube_url", value: "https://www.youtube.com/@MECComputerClub", label: "YouTube URL", description: "Club YouTube channel URL." },
  { key: "address", value: "Mymensingh Engineering College, Mymensingh, Bangladesh", label: "Address", description: "Physical address of the club." },
  { key: "office_hours", value: "Sat–Thu: 10:00–18:00", label: "Office Hours", description: "Office hours shown on the contact page." },
  { key: "membership_fee", value: "500", label: "Membership Fee (BDT)", description: "Annual membership fee in BDT." },
  { key: "founded_year", value: "2015", label: "Founded Year", description: "Year the club was founded." },
];

export const getSiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await SiteSetting.find().sort({ key: 1 }).lean();

    // Seed defaults if empty
    if (settings.length === 0) {
      await SiteSetting.insertMany(DEFAULT_SETTINGS);
      settings = await SiteSetting.find().sort({ key: 1 }).lean();
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Bulk update site settings (admin)
 * @route PUT /api/site-settings
 */
export const updateSiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { settings } = req.body as {
      settings: Array<{ key: string; value: string; label: string; description?: string }>;
    };

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ success: false, message: "settings array is required." });
    }

    // Upsert each setting by key
    const ops = settings.map((s) => ({
      updateOne: {
        filter: { key: s.key },
        update: { $set: { value: s.value, label: s.label, description: s.description } },
        upsert: true,
      },
    }));

    await SiteSetting.bulkWrite(ops);

    const updated = await SiteSetting.find().sort({ key: 1 }).lean();
    res.status(200).json({ success: true, message: "Settings updated successfully.", data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Create or upsert a single setting (admin)
 * @route POST /api/site-settings
 */
export const upsertSiteSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, value, label, description } = req.body;

    if (!key || !label) {
      return res.status(400).json({ success: false, message: "key and label are required." });
    }

    const setting = await SiteSetting.findOneAndUpdate(
      { key },
      { $set: { value, label, description } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};
