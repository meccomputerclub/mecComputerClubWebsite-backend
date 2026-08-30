import { NextFunction, Request, Response } from "express";
import * as userService from "../services/user.service";
import User, { IUser } from "../models/User.model";
import { generateJWT } from "../utils/generateTokens";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service";
import AppError from "../utils/AppError";

export const register = async (req: Request, res: Response) => {
  try {
    // 1. Ensure form data exists
    if (!req.body.data) {
      return res.status(400).json({ success: false, message: "Missing registration data" });
    }

    // 2. Parse JSON payload from FormData
    let payload;
    try {
      payload = JSON.parse(req.body.data);
      payload.socialLinks = {
        facebook: payload.facebook || payload.socialLinks?.facebook || "",
        github: payload.github || payload.socialLinks?.github || "",
        linkedin: payload.linkedin || payload.socialLinks?.linkedin || "",
        codeforces: payload.codeforces || payload.socialLinks?.codeforces || "",
        codechef: payload.codechef || payload.socialLinks?.codechef || "",
        discord: payload.discord || payload.socialLinks?.discord || "",
      };
      delete payload.facebook;
      delete payload.github;
      delete payload.linkedin;
      delete payload.codeforces;
      delete payload.codechef;
      delete payload.discord;

      // Handle role-specific defaults
      const clubRole = payload.clubRole || "member";
      payload.clubRole = clubRole;

      if (!payload.studentId) {
        if (clubRole === "advisor") {
          payload.studentId = payload.facultyId || `FAC-${payload.department || "CSE"}-${Date.now().toString().slice(-4)}`;
        } else if (clubRole === "alumni") {
          payload.studentId = payload.formerStudentId || `ALM-${Date.now().toString().slice(-6)}`;
        } else {
          payload.studentId = `STD-${Date.now().toString().slice(-6)}`;
        }
      }

      if (!payload.session) {
        payload.session = clubRole === "advisor" ? "Faculty" : "2021-22";
      }
      if (!payload.batch) {
        payload.batch = clubRole === "advisor" ? "Faculty" : `${payload.department || "CSE"}`;
      }
      if (clubRole === "alumni") {
        payload.isGraduated = true;
      }
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid JSON format" });
    }

    // 3. Upload image (required)
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Profile image is required" });
    }

    let profileImageUrl: string | null = null;

    try {
      const uploadResult = await uploadToCloudinary(req.file);
      profileImageUrl = uploadResult.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      return res.status(500).json({ success: false, message: "Image upload failed" });
    }

    // 4. Attach image to payload
    payload.imageUrl = profileImageUrl;

    // 5. Unique Check
    const exists = await User.findOne({
      $or: [{ email: payload.email.toLowerCase().trim() }, { studentId: payload.studentId }],
    });

    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Email or student ID already registered" });
    }

    // 6. Create user
    const user = await userService.createUser(payload);

    // 7. Success Response
    return res.status(201).json({
      success: true,
      message: "Registered. Check your email for verification link & code",
      user: {
        id: user._id,
        email: user.email,
        profileImage: profileImageUrl,
      },
    });
  } catch (err: any) {
    console.error("Register error:", err);

    // Check if it's a Mongoose validation error
    if (err.name === "ValidationError") {
      const errors: any = {};
      Object.keys(err.errors).forEach((key) => {
        errors[key] = err.errors[key].message;
      });

      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, studentId, identifier, loginId, password } = req.body;
    const searchIdentifier = (identifier || loginId || email || studentId || "").trim();

    if (!searchIdentifier || !password) {
      return res.status(400).json({ success: false, message: "Please provide your Student ID or Email, and Password." });
    }

    const user = await User.findOne({
      $or: [
        { email: searchIdentifier.toLowerCase() },
        { studentId: searchIdentifier },
      ],
    }).select("+password");

    if (!user) return res.status(401).json({ success: false, message: "No user found" });
    const matched = await user.comparePassword(password);
    if (!matched) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(401).json({
        success: false,
        message: "Email not verified",
        user: {
          id: user._id,
          email: user.email,
          studentId: user.studentId,
          isVerified: user.isVerified,
          applicationStatus: user.applicationStatus,
        },
      });

    if (user.applicationStatus === "rejected")
      return res.status(401).json({
        success: false,
        message: "Application rejected.",
        user: {
          id: user._id,
          email: user.email,
          studentId: user.studentId,
          isVerified: user.isVerified,
          applicationStatus: user.applicationStatus,
          rejectionReason: user.rejectionReason,
        },
      });
    if (user.applicationStatus !== "approved")
      return res.status(401).json({
        success: false,
        message: "Application not approved yet.",
        user: {
          id: user._id,
          email: user.email,
          studentId: user.studentId,
          isVerified: user.isVerified,
          applicationStatus: user.applicationStatus,
        },
      });

    user.lastLogin = new Date();
    await user.save();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    const token = generateJWT({ id: user._id, email: user.email, role: user.role });
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: sevenDaysInMs,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.cookie("role", user.role, {
      httpOnly: true,
      maxAge: sevenDaysInMs,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyEmailToken = async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;
    const user = await userService.verifyUserByToken(email, token);
    res.json({
      message: "Email verified. Admin will review your application",
      user: { id: user._id },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const verifyEmailCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const user = await userService.verifyUserByCode(email, code);
    res.json({
      message: "Email verified (code). Admin will review your application",
      user: { id: user._id },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const requestFastVerification = async (req: Request, res: Response) => {
  try {
    // auth middleware sets req.user
    const userId = (req as any).user.id;
    const user = await userService.requestFastVerification(userId);
    res.json({
      message: "Fast verification requested. Admin will be notified",
      user: { id: user._id },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    await userService.createPasswordReset(req.body.email);
    res.json({ message: "Password reset email sent if account exists" });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    await userService.resetPassword(email, token, newPassword);
    res.status(200).json({ success: true, message: "Password updated" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id, oldPassword, newPassword } = req.body;
    await userService.changePassword(id, oldPassword, newPassword);
    res.status(200).json({ success: true, message: "Password updated" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const identifier = req.params.identifier;

    if (!identifier || identifier.trim() === "") {
      return res.status(400).json({ success: false, message: "Bad request. Identifier is required." });
    }

    const user = await userService.getUserProfile(identifier);
    res.status(200).json({ success: true, message: "User found", data: user });
  } catch (err: any) {
    const msg: string = err?.message || "An error occurred.";

    if (msg.toLowerCase().includes("not found")) {
      return res.status(404).json({ success: false, message: "No member found with that ID, email, or student ID." });
    }
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("not authenticated")) {
      return res.status(401).json({ success: false, message: "Unauthorized access. Please log in again." });
    }
    if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("not allowed")) {
      return res.status(403).json({ success: false, message: "You do not have permission to view this profile." });
    }
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("bad request")) {
      return res.status(400).json({ success: false, message: "Bad request. Please check your input." });
    }
    return res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await userService.getUserProfile(userId);
    res.status(200).json({ success: true, message: "User found", user });
  } catch (err: any) {
    res.clearCookie("auth_token");
    res.clearCookie("role");
    res.status(400).json({ success: false, message: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("auth_token", { httpOnly: true, secure: true, sameSite: "lax" });
    res.clearCookie("role", { httpOnly: true, secure: true, sameSite: "lax" });
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update the currently authenticated user's own profile
 * @route   PATCH /api/users/me
 * @access  Private (any authenticated user)
 */
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    // Only allow safe fields to be updated
    const allowedFields = ["fullName", "contactNumber", "department", "batch", "session", "address", "bio", "socialLinks", "coverUrl", "imageUrl"];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ success: true, message: "No changes provided.", user: null });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -verificationToken -passwordResetToken");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------
// 🚀 PATCH METHODS: API ENDPOINTS FOR UPDATES
// -----------------------------------------------------

/**
 * @desc    Update a user's profile details (partial or full update)
 * @route   PATCH /api/v1/users/:id
 * @access  Private (Admin or Owner)
 */
export const updateUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdToUpdate: string = req.params.id;
    const updates = req.body;
    const user = await User.findById(userIdToUpdate);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const requester = (req as any).user;
    if (user._id.toString() !== requester.id && requester.role !== "admin") {
      return res.status(403).json({ success: false, message: "You are not authorized to perform this action" });
    }
    const protectedFields: Array<"password" | "role" | "email" | "createdAt" | "updatedAt"> = [
      "password",
      "role",
      "email",
      "createdAt",
      "updatedAt",
    ];

    const updateKeys = Object.keys(updates);

    const containsProtectedFields = updateKeys.some((field) =>
      protectedFields.includes(field as "password" | "role" | "email" | "createdAt" | "updatedAt")
    );

    if (containsProtectedFields) {
      return next(
        new AppError(
          "You cannot update protected fields like password, role, or email via this endpoint.",
          403
        )
      );
    }

    // Use a Record utility type for flexible key-value pairs
    const validUpdates: Record<string, any> = {};

    for (const key of updateKeys) {
      const value = updates[key];
      if (value !== undefined && value !== null) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No valid fields provided for update. Skipping update.",
        data: null,
      });
    }

    // --- 3. Mongoose Update Operation ---

    const updatedUser = await User.findByIdAndUpdate(
      userIdToUpdate,
      { $set: validUpdates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    // --- 4. Error Handling ---

    if (!updatedUser) {
      return next(new AppError("No user found with that ID.", 404));
    }

    // --- 5. Success Response ---

    res.status(200).json({
      status: "success",
      message: "User details updated successfully.",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};

export const updateUserImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdToUpdate: string = req.params.id || (req as any).user?.id;
    let user: IUser | null = null;
    try {
      user = await User.findById(userIdToUpdate);
    } catch (error) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const requester = (req as any).user;
    if (user._id.toString() !== requester?.id && requester?.role !== "admin") {
      return res.status(403).json({ success: false, message: "You are not authorized to perform this action" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    let newImageUrl: string | null = null;
    let newImagePublicId: string | null = null;

    try {
      const uploadResult = await uploadToCloudinary(req.file);
      newImageUrl = uploadResult.url || uploadResult.secure_url || (req.file as any).path;
      newImagePublicId = uploadResult.public_id || (req.file as any).filename;
    } catch (err) {
      console.error("Image upload failed:", err);
      return res.status(500).json({ success: false, message: "Image upload failed" });
    }

    // Attempt to delete old photo if exists (safe / non-blocking)
    if (user.imagePublicId) {
      try {
        await deleteFromCloudinary(user.imagePublicId);
      } catch (err) {
        console.warn("Could not delete old image from Cloudinary:", err);
      }
    } else if (user.imageUrl) {
      try {
        const match = user.imageUrl.match(/uploads\/[^.]+/);
        if (match) {
          await deleteFromCloudinary(match[0]);
        }
      } catch (err) {
        console.warn("Could not delete old image from Cloudinary by URL:", err);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userIdToUpdate,
      {
        $set: {
          imageUrl: newImageUrl,
          ...(newImagePublicId ? { imagePublicId: newImagePublicId } : {}),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password -verificationToken -passwordResetToken")
      .lean();

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Profile photo updated successfully.",
      user: updatedUser,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserCover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdToUpdate: string = req.params.id || (req as any).user?.id;
    let user: IUser | null = null;
    try {
      user = await User.findById(userIdToUpdate);
    } catch (error) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const requester = (req as any).user;
    if (user._id.toString() !== requester?.id && requester?.role !== "admin") {
      return res.status(403).json({ success: false, message: "You are not authorized to perform this action" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No cover image file provided" });
    }

    let newCoverUrl: string | null = null;
    let newCoverPublicId: string | null = null;

    try {
      const uploadResult = await uploadToCloudinary(req.file);
      newCoverUrl = uploadResult.url || uploadResult.secure_url || (req.file as any).path;
      newCoverPublicId = uploadResult.public_id || (req.file as any).filename;
    } catch (err) {
      console.error("Cover upload failed:", err);
      return res.status(500).json({ success: false, message: "Cover upload failed" });
    }

    // Attempt to delete old cover if exists (safe / non-blocking)
    if (user.coverPublicId) {
      try {
        await deleteFromCloudinary(user.coverPublicId);
      } catch (err) {
        console.warn("Could not delete old cover from Cloudinary:", err);
      }
    } else if (user.coverUrl) {
      try {
        const match = user.coverUrl.match(/uploads\/[^.]+/);
        if (match) {
          await deleteFromCloudinary(match[0]);
        }
      } catch (err) {
        console.warn("Could not delete old cover from Cloudinary by URL:", err);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userIdToUpdate,
      {
        $set: {
          coverUrl: newCoverUrl,
          ...(newCoverPublicId ? { coverPublicId: newCoverPublicId } : {}),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password -verificationToken -passwordResetToken")
      .lean();

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Cover photo updated successfully.",
      user: updatedUser,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const { role, clubRole, customRole, designation, session, batch, department } = req.body;
  try {
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (clubRole !== undefined) updateData.clubRole = clubRole;
    if (customRole !== undefined) updateData.customRole = customRole;
    if (designation !== undefined) {
      updateData.designation = designation;
      if (customRole === undefined) updateData.customRole = designation;
    }
    if (session !== undefined) updateData.session = session;
    if (batch !== undefined) updateData.batch = batch;
    if (department !== undefined) updateData.department = department;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password")
      .lean();
    res.status(200).json({
      status: "success",
      message: "User role updated successfully.",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await User.find({
      applicationStatus: "approved",
    })
      .select(
        "_id fullName imageUrl role clubRole customRole designation session batch department socialLinks bio isGraduated passingYear"
      )
      .lean();

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const adminCreateMember = async (req: Request, res: Response) => {
  try {
    if (!req.body.data) {
      return res.status(400).json({ success: false, message: "Missing member data" });
    }

    let payload: any;
    try {
      payload = JSON.parse(req.body.data);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid JSON format" });
    }

    if (!payload.fullName || !payload.email) {
      return res.status(400).json({ success: false, message: "Full Name and Email are required" });
    }

    // Process image if uploaded
    let profileImageUrl = "";
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file);
        profileImageUrl = uploadResult.url;
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    }

    if (profileImageUrl) {
      payload.imageUrl = profileImageUrl;
    } else if (!payload.imageUrl) {
      payload.imageUrl = "";
    }

    // Format social links if provided
    payload.socialLinks = {
      facebook: payload.facebook || payload.socialLinks?.facebook || "",
      github: payload.github || payload.socialLinks?.github || "",
      linkedin: payload.linkedin || payload.socialLinks?.linkedin || "",
      codeforces: payload.codeforces || payload.socialLinks?.codeforces || "",
      codechef: payload.codechef || payload.socialLinks?.codechef || "",
      discord: payload.discord || payload.socialLinks?.discord || "",
    };

    // Defaults based on role
    const clubRole = payload.clubRole || "member";
    payload.clubRole = clubRole;

    if (!payload.role) {
      payload.role = payload.systemRole || "member";
    }

    if (!payload.studentId) {
      if (clubRole === "advisor") {
        payload.studentId = payload.facultyId || `FAC-${Date.now().toString().slice(-6)}`;
      } else if (clubRole === "alumni") {
        payload.studentId = payload.formerStudentId || `ALM-${Date.now().toString().slice(-6)}`;
      } else {
        payload.studentId = `STD-${Date.now().toString().slice(-6)}`;
      }
    }

    if (!payload.session) {
      payload.session = clubRole === "advisor" ? "Faculty" : "2021-22";
    }
    if (!payload.batch) {
      payload.batch = clubRole === "advisor" ? "Faculty" : `${payload.department || "CSE"}`;
    }
    if (!payload.department) {
      payload.department = "CSE";
    }
    if (!payload.contactNumber) {
      payload.contactNumber = "N/A";
    }

    if (clubRole === "alumni") {
      payload.isGraduated = true;
    }

    // Default password if not provided
    if (!payload.password) {
      payload.password = "MEC-CC@" + Math.floor(1000 + Math.random() * 9000);
    }

    // Direct approval & verification for admin created member
    payload.isVerified = true;
    payload.applicationStatus = "approved";
    payload.profileStatus = "active";
    payload.approvedAt = new Date();
    payload.emailVerifiedAt = new Date();
    payload.approvedBy = (req as any).user?.id || null;

    // Check unique email and studentId
    const exists = await User.findOne({
      $or: [{ email: payload.email.toLowerCase().trim() }, { studentId: payload.studentId }],
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: exists.email === payload.email.toLowerCase().trim()
          ? "Email already registered"
          : "Student/Faculty ID already registered",
      });
    }

    const newUser = new User(payload);
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: `${clubRole === "advisor" ? "Advisor" : clubRole === "alumni" ? "Alumni" : "Member"} created and approved successfully!`,
      data: newUser,
    });
  } catch (err: any) {
    console.error("Admin create member error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

