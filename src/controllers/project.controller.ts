import { Request, Response, NextFunction } from "express";
import { Project } from "../models/Project.model";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "project"}-${Date.now().toString(36)}`;
}

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const isAdmin = user?.role === "admin" || user?.role === "moderator";

    const {
      title,
      description,
      department,
      status,
      startDate,
      endDate,
      githubLink,
      repoUrl,
      liveDemoLink,
      liveUrl,
      requiredSkills,
      techStack,
      imageUrl,
      image,
      featured,
      teamMembers,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Project title and description are required" });
    }

    const skills = Array.isArray(requiredSkills) && requiredSkills.length > 0
      ? requiredSkills
      : Array.isArray(techStack) && techStack.length > 0
      ? techStack
      : typeof techStack === "string"
      ? techStack.split(",").map((s: string) => s.trim()).filter(Boolean)
      : typeof requiredSkills === "string"
      ? requiredSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const memberIds = Array.isArray(teamMembers)
      ? teamMembers.filter(Boolean)
      : typeof teamMembers === "string"
      ? teamMembers.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    if (userId && !memberIds.includes(userId)) {
      memberIds.unshift(userId);
    }

    const project = await Project.create({
      title: title.trim(),
      slug: generateSlug(title),
      description: description.trim(),
      department: department || "webdev",
      status: status || "in_progress",
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      githubLink: githubLink || repoUrl || "",
      liveDemoLink: liveDemoLink || liveUrl || "",
      teamMembers: memberIds,
      createdBy: userId || undefined,
      requiredSkills: skills,
      techStack: skills,
      imageUrl: imageUrl || image || "",
      featured: isAdmin ? Boolean(featured) : false,
    });

    const populated = await Project.findById(project._id)
      .populate("teamMembers", "fullName imageUrl studentId department role email")
      .populate("createdBy", "fullName imageUrl studentId email");

    res.status(201).json({
      success: true,
      data: populated || project,
      message: "Project created successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const projects = await Project.find({
      $or: [{ teamMembers: userId }, { createdBy: userId }],
    })
      .populate("teamMembers", "fullName imageUrl studentId department role")
      .populate("createdBy", "fullName imageUrl studentId email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const proposeProject = async (req: Request, res: Response, next: NextFunction) => {
  return createProject(req, res, next);
};

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, any> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.featured !== undefined) {
      filter.featured = String(req.query.featured) === "true";
    }

    const projects = await Project.find(filter)
      .populate("teamMembers", "fullName imageUrl studentId department role email")
      .populate("createdBy", "fullName imageUrl studentId email")
      .sort({ featured: -1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("teamMembers", "fullName imageUrl studentId department role email")
      .populate("createdBy", "fullName imageUrl studentId email")
      .lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const toggleFeaturedProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const newFeatured = req.body.featured !== undefined ? Boolean(req.body.featured) : !project.featured;
    project.featured = newFeatured;
    await project.save();

    const populated = await Project.findById(project._id)
      .populate("teamMembers", "fullName imageUrl studentId department role email")
      .populate("createdBy", "fullName imageUrl studentId email");

    res.status(200).json({
      success: true,
      data: populated || project,
      message: newFeatured ? "Project highlighted on Home page!" : "Project removed from Home highlights",
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const isAdmin = user?.role === "admin" || user?.role === "moderator";

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const isCreator = project.createdBy && project.createdBy.toString() === userId;
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }

    const updates = { ...req.body };
    // Only admins can modify the featured status
    if (!isAdmin) {
      delete updates.featured;
    }

    if (updates.techStack && !updates.requiredSkills) {
      updates.requiredSkills = Array.isArray(updates.techStack)
        ? updates.techStack
        : typeof updates.techStack === "string"
        ? updates.techStack.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("teamMembers", "fullName imageUrl studentId department role email")
      .populate("createdBy", "fullName imageUrl studentId email");

    res.status(200).json({ success: true, data: updated, message: "Project updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const isAdmin = user?.role === "admin" || user?.role === "moderator";

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const isCreator = project.createdBy && project.createdBy.toString() === userId;
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};
