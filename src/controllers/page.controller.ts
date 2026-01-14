import { Request, Response } from "express";
import { HomePage } from "../models/Page.model";

/**
 * @desc    Get Home Page data
 * @route   GET /api/homepage
 */
export const getHomePage = async (req: Request, res: Response) => {
  try {
    // We use findOne because there's usually only one homepage config
    const homeData = await HomePage.findOne()
      .populate("featuredData.sponsors")
      .populate("featuredData.events")
      .populate("featuredData.projects")
      .populate("featuredData.blogs");

    if (!homeData) {
      return res.status(404).json({ message: "Home page data not found" });
    }

    res.status(200).json(homeData);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

/**
 * @desc    Update or Create Home Page data
 * @route   POST /api/homepage (or PUT)
 */
export const updateHomePage = async (req: Request, res: Response) => {
  try {
    // upsert: true will create the document if it doesn't exist
    // new: true returns the modified document rather than the original
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
 * @desc    Reset stats (Example of a specific action)
 * @route   PATCH /api/homepage/stats
 */
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
