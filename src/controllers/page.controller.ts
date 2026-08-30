import { Request, Response } from "express";
import { HomePage } from "../models/Page.model";

export const getHomePage = async (req: Request, res: Response) => {
  try {
    const homeData = await HomePage.findOne()
      .populate("featuredData.sponsors")
      .populate("featuredData.events")
      .populate("featuredData.projects")
      .populate("featuredData.blogs");

    if (!homeData) {
      return res.status(404).json({ message: "Home page data not found" });
    }

    res.status(200).json({ success: true, data: homeData });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

export const updateHomePage = async (req: Request, res: Response) => {
  try {
    const updatedData = await HomePage.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Home page updated successfully",
      data: updatedData,
    });
  } catch (error) {
    res.status(400).json({ message: "Validation or Server Error", error });
  }
};

/**
 * @desc  Partial update — only sets the fields provided (no required-field validation errors)
 * @route PATCH /api/page
 */
export const patchHomePage = async (req: Request, res: Response) => {
  try {
    // Build a flat $set map so only provided fields are updated
    const body = req.body as Record<string, any>;
    const setMap: Record<string, any> = {};

    const flatten = (obj: Record<string, any>, prefix = "") => {
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
          flatten(val, fullKey);
        } else {
          setMap[fullKey] = val;
        }
      }
    };

    flatten(body);

    const updatedData = await HomePage.findOneAndUpdate(
      {},
      { $set: setMap },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Home page updated successfully",
      data: updatedData,
    });
  } catch (error) {
    res.status(400).json({ message: "Update failed", error });
  }
};

export const updateStats = async (req: Request, res: Response) => {
  try {
    const updatedStats = await HomePage.findOneAndUpdate(
      {},
      { $set: { "heroSection.stats": req.body } },
      { new: true }
    );
    res.status(200).json(updatedStats?.heroSection.stats);
  } catch (error) {
    res.status(400).json({ message: "Error updating stats", error });
  }
};
