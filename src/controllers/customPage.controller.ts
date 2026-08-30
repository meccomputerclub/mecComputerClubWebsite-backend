import { Request, Response, NextFunction } from "express";
import { CustomPage } from "../models/CustomPage.model";

export const createCustomPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await CustomPage.create(req.body);
    res.status(201).json({ success: true, data: page });
  } catch (error) { next(error); }
};

export const getAllCustomPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = await CustomPage.find().sort({ updatedAt: -1 }).lean();
    res.status(200).json({ success: true, data: pages });
  } catch (error) { next(error); }
};

export const getCustomPageBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await CustomPage.findOne({ slug: req.params.slug }).lean();
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.status(200).json({ success: true, data: page });
  } catch (error) { next(error); }
};

export const getCustomPageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await CustomPage.findById(req.params.id).lean();
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.status(200).json({ success: true, data: page });
  } catch (error) { next(error); }
};

export const updateCustomPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await CustomPage.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.status(200).json({ success: true, data: page });
  } catch (error) { next(error); }
};

export const deleteCustomPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await CustomPage.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.status(200).json({ success: true, message: "Page deleted" });
  } catch (error) { next(error); }
};
