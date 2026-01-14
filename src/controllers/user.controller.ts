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
        facebook: payload.facebook || "",
        github: payload.github || "",
        linkedin: payload.linkedin || "",
      };
      delete payload.facebook;
      delete payload.github;
      delete payload.linkedin;

      // console.log("Parsed registration payload:", payload);
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
      console.log("uploadResult: ", uploadResult);

      // Convert system file path → public URL
      profileImageUrl = uploadResult.url; // already public URL
    } catch (err) {
      console.error("Image upload failed:", err);
      return res.status(500).json({ success: false, message: "Image upload failed" });
    }

    // 4. Attach image to payload
    payload.imageUrl = profileImageUrl;

    // 5. Unique Check
    const exists = await User.findOne({
      $or: [{ email: payload.email }, { studentId: payload.studentId }],
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
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "No user found" });
    const matched = await user.comparePassword(password);
    if (!matched) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(401).json({
        success: false,
        message: "Email not verified",
        user: {
          id: user._id,
          email,
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
          email,
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
          email,
          isVerified: user.isVerified,
          applicationStatus: user.applicationStatus,
        },
      });

    user.lastLogin = new Date();
    await user.save();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    const token = generateJWT({ id: user._id, email: user.email, role: user.role });
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: sevenDaysInMs,
      secure: true,
      sameSite: "none",
    });
    res.cookie("role", user.role, {
      httpOnly: true,
      maxAge: sevenDaysInMs,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
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
    const user = await userService.getUserProfile(identifier);
    res.status(200).json({ success: true, message: "User found", data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
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
    res.clearCookie("auth_token");
    res.clearCookie("role");
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
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
    if (user?._id !== (req as any).user.id) {
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
      }
    }
    if (user === null) {
      return res.status(404).json({ message: "User not found" });
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
  const userIdToUpdate: string = req.params.id;
  let user: IUser | null;
  try {
    user = await User.findById(userIdToUpdate);
  } catch (error) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user?._id !== (req as any).user.id) {
    if ((req as any).user.role !== "admin") {
      console.log((req as any).user.role);
      return res.status(403).json({ message: "You are not authorized to perform this action" });
    }
  }
  if (user === null) {
    return res.status(404).json({ message: "User not found" });
  }

  let newImageUrl: string | null = null;
  if (req.file) {
    try {
      user.fullName;
      const uploadResult = await uploadToCloudinary(req.file);
      newImageUrl = uploadResult.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      return res.status(500).json({ success: false, message: "Image upload failed" });
    }
  }

  //delete old photo
  if (req.file && user.imageUrl) {
    try {
      await deleteFromCloudinary(user.imageUrl);
    } catch (err) {
      console.error("Image deletion failed:", err);
      return res
        .status(500)
        .json({ success: false, message: "Image uploaded but previous image deletion failed" });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userIdToUpdate,
    { $set: { imageUrl: newImageUrl } },
    {
      new: true,
      runValidators: true,
    }
  )
    .select("-password")
    .lean();

  res.status(200).json({
    status: "success",
    message: "User avatar updated successfully.",
    data: {
      user: updatedUser,
    },
  });
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const { role } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
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
