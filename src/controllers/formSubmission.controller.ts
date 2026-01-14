import { Request, Response, NextFunction } from "express";
import FormModel from "../models/Form.model";
import FormSubmissionModel from "../models/FormSubmission.model";
import AppError from "../utils/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: { _id: string; [key: string]: any };
    }
  }
}

/**
 * Submit a form
 */
export const submitForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    const { responses } = req.body;

    const form = await FormModel.findById(formId);
    if (!form || !form.isActive) {
      return next(new AppError("Form not available", 404));
    }

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && responses[field.name] == null) {
        return next(new AppError(`"${field.label}" is required`, 400));
      }
    }

    const submission = await FormSubmissionModel.create({
      formId,
      userId: req?.user?._id,
      responses,
    });

    res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all submissions for a form (Admin)
 */
export const getSubmissionsByForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await FormSubmissionModel.find({
      formId: req.params.formId,
    }).populate("userId", "fullName email");

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};
