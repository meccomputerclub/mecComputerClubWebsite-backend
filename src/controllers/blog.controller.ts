import { Request, Response, NextFunction } from "express";
import { Blog } from "../models/Blog.model";

export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorId = (req as any).user?.id;
    const blog = await Blog.create({ ...req.body, author: authorId });
    res.status(201).json({ success: true, data: blog });
  } catch (error) { next(error); }
};

export const getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, any> = {};
    if (req.query.published === "true") filter.isPublished = true;
    if (req.query.category) filter.category = req.query.category;
    const blogs = await Blog.find(filter)
      .populate("author", "fullName imageUrl")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: blogs });
  } catch (error) { next(error); }
};

export const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "fullName imageUrl").lean();
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    // Increment views
    await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.status(200).json({ success: true, data: blog });
  } catch (error) { next(error); }
};

export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const update = { ...req.body };
    if (update.isPublished && !update.publishedAt) update.publishedAt = new Date();
    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, data: blog });
  } catch (error) { next(error); }
};

export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (error) { next(error); }
};
