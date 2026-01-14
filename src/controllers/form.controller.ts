import { Request, Response, NextFunction } from "express";
import FormModel from "../models/Form.model";
import AppError from "../utils/AppError";
import { ApiFeatures } from "../utils/apiFeatures";
import { buildHateoas } from "../utils/hateoas";

/**
 * Create a new form for an event (Admin)
 */
export const createForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, eventId, description, startDate, endDate, fields } = req.body;

    if (!title || !eventId || !fields?.length) {
      return next(new AppError("Title, eventId and fields are required", 400));
    }

    const form = await FormModel.create({
      title,
      eventId,
      description: description || "",
      startDate,
      endDate,
      fields,
    });

    res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAllForms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forms = await FormModel.find();

    res.json({
      success: true,
      data: forms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all forms for a specific event
 */

export const getFormsByEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;

    const total = await FormModel.countDocuments({
      eventId: req.params.eventId,
    });

    const features = new ApiFeatures(FormModel.find({ eventId: req.params.eventId }), req.query)
      .filter()
      .sort()
      .paginate();

    const forms = await features["mongooseQuery"];

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    res.json({
      success: true,
      count: forms.length,
      total,
      links: buildHateoas(baseUrl, page, limit, total),
      data: forms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single form (used before submission)
 */
export const getFormById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const form = await FormModel.findById(req.params.id);

    if (!form) {
      return next(new AppError("Form not found", 404));
    }

    res.json({
      success: true,
      data: form,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disable a form (Admin)
 */
export const disableForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const form = await FormModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!form) {
      return next(new AppError("Form not found", 404));
    }

    res.json({
      success: true,
      message: "Form disabled successfully",
    });
  } catch (error) {
    next(error);
  }
};
