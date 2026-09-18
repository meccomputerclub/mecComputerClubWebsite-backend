import { Request, Response, NextFunction } from "express";
import Course from "../models/Course.model";

export function normalizeDepartment(dept?: string): string {
  if (!dept) return "CSE";
  const upper = dept.toUpperCase();
  if (upper.includes("COMPUTER") || upper.includes("CSE")) return "CSE";
  if (upper.includes("ELECTRICAL") || upper.includes("EEE")) return "EEE";
  if (upper.includes("CIVIL") || upper.includes("CE")) return "CE";
  return dept.trim().toUpperCase();
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export const searchCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, department } = req.query;
    const filter: any = { status: "approved" };

    if (department) {
      filter.department = normalizeDepartment(department as string);
    }

    if (q && typeof q === "string" && q.trim()) {
      const escaped = escapeRegex(q.trim());
      filter.$or = [
        { courseName: { $regex: escaped, $options: "i" } },
        { courseCode: { $regex: escaped, $options: "i" } },
      ];
    }

    const courses = await Course.find(filter)
      .sort({ courseCode: 1 })
      .limit(20)
      .lean();

    res.status(200).json({
      status: "success",
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const submitCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseName, courseCode, courseCredit, department } = req.body;

    if (!courseName?.trim() || !courseCode?.trim()) {
      return res.status(400).json({
        status: "fail",
        message: "Course name and course code are required.",
      });
    }

    const normalizedDept = normalizeDepartment(department);
    const cleanCode = courseCode.trim().toUpperCase();

    // Check if courseCode already exists for this department
    const existing = await Course.findOne({
      courseCode: { $regex: new RegExp(`^${escapeRegex(cleanCode)}$`, "i") },
      department: normalizedDept,
    });

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Course already exists in records.",
        data: existing,
        isDuplicate: true,
      });
    }

    const isAdmin = (req as any).user && ["admin", "moderator"].includes((req as any).user.role);
    const initialStatus = isAdmin && req.body.status ? req.body.status : "pending";

    const newCourse = await Course.create({
      courseName: courseName.trim(),
      courseCode: cleanCode,
      courseCredit: courseCredit ? courseCredit.trim() : "",
      department: normalizedDept,
      status: initialStatus,
      submittedBy: (req as any).user?.id || null,
      reviewedBy: isAdmin && initialStatus === "approved" ? (req as any).user?.id : null,
    });

    res.status(201).json({
      status: "success",
      message: initialStatus === "approved" ? "Course created and approved." : "Course submitted for review.",
      data: newCourse,
      isDuplicate: false,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(200).json({
        status: "success",
        message: "Course already exists.",
        isDuplicate: true,
      });
    }
    next(error);
  }
};

export const getAllCourses = async (req: Request, res: Response, next: NextFunction) => {
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
        { courseName: { $regex: escaped, $options: "i" } },
        { courseCode: { $regex: escaped, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [courses, total, pendingCount, approvedCount] = await Promise.all([
      Course.find(filter)
        .populate("submittedBy", "fullName studentId email")
        .populate("reviewedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Course.countDocuments(filter),
      Course.countDocuments({ status: "pending" }),
      Course.countDocuments({ status: "approved" }),
    ]);

    res.status(200).json({
      status: "success",
      data: courses,
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

export const updateCourseStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "pending"].includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid status value. Must be 'approved' or 'pending'.",
      });
    }

    const updated = await Course.findByIdAndUpdate(
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
        message: "Course not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: `Course status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { courseName, courseCode, courseCredit, department, status } = req.body;

    const updateData: any = {};
    if (courseName) updateData.courseName = courseName.trim();
    if (courseCode) updateData.courseCode = courseCode.trim().toUpperCase();
    if (courseCredit !== undefined) updateData.courseCredit = courseCredit ? courseCredit.trim() : "";
    if (department) updateData.department = normalizeDepartment(department);
    if (status) {
      updateData.status = status;
      if (status === "approved" && (req as any).user?.id) {
        updateData.reviewedBy = (req as any).user.id;
      }
    }

    const updated = await Course.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updated) {
      return res.status(404).json({
        status: "fail",
        message: "Course not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Course updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "Another course with this code already exists in this department.",
      });
    }
    next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await Course.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: "fail",
        message: "Course not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Course deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};
