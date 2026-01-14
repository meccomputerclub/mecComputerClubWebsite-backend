import InvitationCode from "../models/InvitationCode.model";
import { generateOtpCode } from "../utils/generateInviteCode";
import { Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail";
import UserModel from "../models/User.model";
import { generateEmail } from "../utils/generateEmailTemplate";

export const createInvitationCode = async (req: Request, res: Response) => {
  try {
    const { formId, email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    //check if the email is already registered
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate unique code
    let code = generateOtpCode();
    let existing = await InvitationCode.findOne({ code });

    while (existing) {
      code = generateOtpCode();
      existing = await InvitationCode.findOne({ code });
    }

    // Set expiration (30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invite = await InvitationCode.create({
      code,
      formId,
      role,
      email,
      expiresAt,
      status: "consumable",
    });
    let template = generateEmail("invitation", {
      code: invite.code,
      link: `${process.env.FRONTEND_URL}/register?code=` + invite.code,
    });

    await sendEmail(email, "Your MEC Computer Club Invitation Code", template);

    return res.json({
      success: true,
      message: "Invitation code generated and emailed successfully",
      invite,
    });
  } catch (err) {
    console.error(err);
    // check validation error
    if (err instanceof Error && err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    } else if (err instanceof Error && err.name === "MongooseError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};
export const getCodeInfo = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    const invite = await InvitationCode.findOne({ code });
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation code",
      });
    }
    return res.json({
      success: true,
      data: invite,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const verifyInvitationCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Invitation code is required",
      });
    }

    const invite = await InvitationCode.findOne({ code });

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invalid invitation code",
      });
    }

    // Expired
    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();

      return res.status(410).json({
        success: false,
        message: "Invitation code expired",
      });
    }

    // Used or cancelled
    if (invite.status !== "consumable") {
      return res.status(400).json({
        success: false,
        message: `Invitation code is ${invite.status}`,
      });
    }

    // Set cookie
    res.cookie("invitation_validated", "358", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000, // 30 minutes
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Invitation code verified",
      data: {
        formId: invite.formId,
        email: invite.email,
        role: invite.role,
        status: invite.status,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const consumeInvitationCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    const invite = await InvitationCode.findOne({ code });

    if (!invite) return res.status(404).json({ message: "Invalid code" });

    if (code === "MCC@25") {
      return res.json({ success: true, message: "Special code consumed successfully" });
    }

    invite.status = "consumed";
    await invite.save();

    return res.json({ success: true, message: "Code consumed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const cancelInvitationCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    const invite = await InvitationCode.findOne({ code });

    if (!invite) return res.status(404).json({ message: "Code not found" });

    invite.status = "cancelled";
    await invite.save();

    res.json({ success: true, message: "Code cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
