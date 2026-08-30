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

    // Check for duplicate submissions if restricted
    if (!form.allowMultipleSubmissions) {
      const userId = req?.user?._id;
      const submittedEmail =
        responses?.email_address ||
        responses?.email ||
        responses?.contact_email ||
        null;

      if (userId) {
        const existing = await FormSubmissionModel.findOne({ formId, userId });
        if (existing) {
          return next(new AppError("You have already submitted a response for this form.", 400));
        }
      } else if (submittedEmail) {
        // For anonymous submissions, check by email in responses
        const allSubs = await FormSubmissionModel.find({ formId });
        const emailExists = allSubs.some((sub) => {
          const r = sub.responses as Record<string, any>;
          return (
            r?.email_address === submittedEmail ||
            r?.email === submittedEmail ||
            r?.contact_email === submittedEmail
          );
        });
        if (emailExists) {
          return next(new AppError("A response with this email has already been submitted.", 400));
        }
      }
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

import * as XLSX from "xlsx";

/**
 * Export form submissions as CSV or XLSX file directly from backend (Admin)
 */
export const exportSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    const format = (req.query.format as string)?.toLowerCase() === "csv" ? "csv" : "xlsx";

    const form = await FormModel.findById(formId);
    if (!form) {
      return next(new AppError("Form not found", 404));
    }

    const submissions = await FormSubmissionModel.find({ formId }).populate("userId", "fullName email");
    const fields = form.fields || [];

    const headers = ["#", "Submitted By", "Account Email", "Submitted At", ...fields.map((f) => f.label)];
    const rows = submissions.map((sub: any, i) => [
      i + 1,
      sub.userId?.fullName || "Anonymous",
      sub.userId?.email || "N/A",
      new Date(sub.createdAt).toLocaleString("en-GB"),
      ...fields.map((f) => {
        const val = sub.responses?.[f.name];
        if (val == null) return "";
        if (Array.isArray(val)) return val.join(", ");
        if (typeof val === "object") return val.url || JSON.stringify(val);
        return String(val);
      }),
    ]);

    const sanitizedTitle = (form.title || "Form Responses").replace(/[/\\?%*:|"<>]/g, "_").trim();

    if (format === "xlsx") {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 6 },
        { wch: 22 },
        { wch: 26 },
        { wch: 20 },
        ...fields.map((f) => ({ wch: Math.max(18, Math.min(45, f.label.length + 4)) })),
      ];

      const wb = XLSX.utils.book_new();
      const sheetName = (form.title || "Responses").slice(0, 31).replace(/[/\\?*[\]]/g, "_");
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const fileName = `${sanitizedTitle} - Responses.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
      res.send(buffer);
    } else {
      const csvContent = [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\r\n");

      const fileName = `${sanitizedTitle} - Responses.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
      res.send("\uFEFF" + csvContent);
    }
  } catch (error) {
    next(error);
  }
};
