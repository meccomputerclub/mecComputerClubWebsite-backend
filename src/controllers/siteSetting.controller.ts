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
  // Batch settings — current most-junior (smallest) batch number per department.
  // The registration form shows the last 10 batches up to this number.
  { key: "batch_current_CSE", value: "6", label: "CSE — Current Junior Batch No.", description: "The most junior (latest) CSE batch number. Registration form shows the last 10 batches up to this number (e.g., 6 shows 1st–6th Batch)." },
  { key: "batch_current_EEE", value: "14", label: "EEE — Current Junior Batch No.", description: "The most junior (latest) EEE batch number. Registration form shows the last 10 batches up to this number." },
  { key: "batch_current_CE", value: "8", label: "CE — Current Junior Batch No.", description: "The most junior (latest) CE batch number. Registration form shows the last 10 batches up to this number." },
];


export const getSiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await SiteSetting.find().sort({ key: 1 }).lean();

    // Ensure all default settings exist
    const existingKeys = new Set(settings.map((s) => s.key));
    const missingDefaults = DEFAULT_SETTINGS.filter((d) => !existingKeys.has(d.key));
    if (missingDefaults.length > 0) {
      await SiteSetting.insertMany(missingDefaults);
      settings = await SiteSetting.find().sort({ key: 1 }).lean();
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Public endpoint — returns only batch_current_* settings (no auth required)
 * @route GET /api/site-settings/public
 */
export const getPublicBatchSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let batchSettings = await SiteSetting.find({ key: /^batch_current_/ }).lean();

    // If any batch defaults are missing, insert them
    const existingBatchKeys = new Set(batchSettings.map((s) => s.key));
    const missingBatchDefaults = DEFAULT_SETTINGS.filter(
      (d) => d.key.startsWith("batch_current_") && !existingBatchKeys.has(d.key)
    );
    if (missingBatchDefaults.length > 0) {
      await SiteSetting.insertMany(missingBatchDefaults);
      batchSettings = await SiteSetting.find({ key: /^batch_current_/ }).lean();
    }

    // Build a clean map: { CSE: 6, EEE: 14, CE: 8 }
    const batchMap: Record<string, number> = { CSE: 6, EEE: 14, CE: 8 };
    for (const s of batchSettings) {
      const dept = s.key.replace("batch_current_", "");
      batchMap[dept] = parseInt(s.value) || 1;
    }

    res.status(200).json({ success: true, data: batchMap });
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
