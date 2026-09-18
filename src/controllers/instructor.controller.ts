import { Request, Response, NextFunction } from "express";
import Instructor from "../models/Instructor.model";
import { normalizeDepartment } from "./course.controller";

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export const searchInstructors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, department } = req.query;
    const filter: any = { status: "approved" };

    if (department) {
      filter.department = normalizeDepartment(department as string);
    }

    if (q && typeof q === "string" && q.trim()) {
      const escaped = escapeRegex(q.trim());
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { designation: { $regex: escaped, $options: "i" } },
      ];
    }

    const instructors = await Instructor.find(filter)
      .sort({ name: 1 })
      .limit(20)
      .lean();

    res.status(200).json({
      status: "success",
      data: instructors,
    });
  } catch (error) {
    next(error);
  }
};

export const submitInstructor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, designation, department, institution } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        status: "fail",
        message: "Instructor name is required.",
      });
    }

    const normalizedDept = normalizeDepartment(department);
    const cleanName = name.trim();

    // Check if instructor already exists for this department
    const existing = await Instructor.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, "i") },
      department: normalizedDept,
    });

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Instructor already exists in records.",
        data: existing,
        isDuplicate: true,
      });
    }

    const isAdmin = (req as any).user && ["admin", "moderator"].includes((req as any).user.role);
    const initialStatus = isAdmin && req.body.status ? req.body.status : "pending";

    const newInstructor = await Instructor.create({
      name: cleanName,
      designation: designation?.trim() || "Lecturer",
      department: normalizedDept,
      institution: institution?.trim() || "Mymensingh Engineering College",
      status: initialStatus,
      submittedBy: (req as any).user?.id || null,
      reviewedBy: isAdmin && initialStatus === "approved" ? (req as any).user?.id : null,
    });

    res.status(201).json({
      status: "success",
      message: initialStatus === "approved" ? "Instructor created and approved." : "Instructor submitted for review.",
      data: newInstructor,
      isDuplicate: false,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(200).json({
        status: "success",
        message: "Instructor already exists.",
        isDuplicate: true,
      });
    }
    next(error);
  }
};

export const getAllInstructors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, status, search, page = "1", limit = "20" } = req.query;

    const filter: any = {};
    if (department && department !== "all") {
      filter.department = normalizeDepartment(department as string);
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search && typeof search === "string" && search.trim()) {
      const escaped = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { designation: { $regex: escaped, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [instructors, total, pendingCount, approvedCount] = await Promise.all([
      Instructor.find(filter)
        .populate("submittedBy", "fullName studentId email")
        .populate("reviewedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Instructor.countDocuments(filter),
      Instructor.countDocuments({ status: "pending" }),
      Instructor.countDocuments({ status: "approved" }),
    ]);

    res.status(200).json({
      status: "success",
      data: instructors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        total: pendingCount + approvedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInstructorStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "pending"].includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid status value. Must be 'approved' or 'pending'.",
      });
    }

    const updated = await Instructor.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: (req as any).user?.id || null,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: "fail",
        message: "Instructor not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: `Instructor status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInstructor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, designation, department, institution, status } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (designation) updateData.designation = designation.trim();
    if (department) updateData.department = normalizeDepartment(department);
    if (institution) updateData.institution = institution.trim();
    if (status) {
      updateData.status = status;
      if (status === "approved" && (req as any).user?.id) {
        updateData.reviewedBy = (req as any).user.id;
      }
    }

    const updated = await Instructor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updated) {
      return res.status(404).json({
        status: "fail",
        message: "Instructor not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Instructor updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "Another instructor with this name already exists in this department.",
      });
    }
    next(error);
  }
};

export const deleteInstructor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await Instructor.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: "fail",
        message: "Instructor not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Instructor deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};
