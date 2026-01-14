import User, { IUser } from "../models/User.model";
import { ProfessionalCareer } from "../models/ProfessionalCareer.model";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail";
import { generateEmail } from "../utils/generateEmailTemplate";
import { generateOtpCode } from "../utils/generateInviteCode";
import InvitationCodeModel from "../models/InvitationCode.model";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const createUser = async (payload: Partial<IUser>) => {
  const user = new User(payload);
  // generate verification tokens
  const { token, code } = user.generateEmailVerification();
  await user.save();

  // prepare verification links
  const verifyLink = `${FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(
    user.email
  )}`;

  const htmlTemplate = generateEmail("emailVerification", {
    userName: user.fullName,
    link: verifyLink,
    code,
  });

  await sendEmail(user.email, "Verify your MEC Computer Club account", htmlTemplate);

  //void invitation code if any
  try {
    const invitationCode = await InvitationCodeModel.findOne({ email: user.email });
    if (invitationCode) {
      await InvitationCodeModel.findByIdAndUpdate(invitationCode._id, {
        $set: { status: "consumed" },
      });
    }
  } catch (error) {
    console.log("Error changing invitation code.");
  }

  // notify admins (for now, just send a mail placeholder - you can send to admin list)
  // optional: send an email to admins here
  return user;
};

export const findByEmail = async (email: string) => {
  return User.findOne({ email });
};

export const verifyUserByToken = async (email: string, token: string) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    email,
    verificationToken: hashed,
    verificationTokenExpiry: { $gt: new Date() },
  });
  if (!user) throw new Error("Invalid or expired token");

  user.isVerified = true;
  user.applicationStatus = "pending";
  user.emailVerifiedAt = new Date();
  user.verificationCode = undefined;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  // Notify admins via email that a new verified user applied - implement as needed
  // e.g., sendEmail(adminEmail, "New member needs approval", ...)

  return user;
};

export const verifyUserByCode = async (email: string, code: string) => {
  const user = await User.findOne({ email, verificationCode: code });
  if (!user) throw new Error("Invalid code");
  // optional: check expiry if you want code to expire with token
  user.isVerified = true;
  user.applicationStatus = "pending";
  user.emailVerifiedAt = new Date();
  user.verificationCode = undefined;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  // await user.save();

  // Notify admins via email that a new verified user applied
  // e.g., sendEmail(adminEmail, "New member needs approval", ...)
  const emailTemplate = generateEmail("adminMailForMemberRegistration", {
    userName: user.fullName,
    email: user.email,
    contactNumber: user.contactNumber || "N/A",
    session: user.session,
    department: user.department,
    batch: user.batch,
    studentId: user.studentId,
    link: `${FRONTEND_URL}/dashboard/members`,
    userImageUrl: user.imageUrl,
  });
  await sendEmail(
    "nasir2242001@gmail.com, mdshazid121@gmail.com",
    "New member needs approval",
    emailTemplate
  );

  await user.save();
  return user;
};

export const requestFastVerification = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = new Date();

  // reset count if new day
  const lastReq = user.lastFastVerificationRequest;
  if (!lastReq || lastReq.toDateString() !== now.toDateString()) {
    user.requestedFastVerificationCount = 0;
  }

  if (user.requestedFastVerificationCount >= 2) {
    throw new Error("Maximum fast verification requests reached for today");
  }

  if (user.lastFastVerificationRequest) {
    const diff = now.getTime() - user.lastFastVerificationRequest.getTime();
    if (diff < 30 * 60 * 1000) {
      throw new Error("You must wait 30 minutes between fast verification requests");
    }
  }

  user.requestedFastVerificationCount += 1;
  user.lastFastVerificationRequest = now;
  await user.save();

  // send email to admins requesting fast verification (admin should verify and hit approve endpoint)
  // implement admin list or single admin email
  // sendEmail(adminEmail, "User requested fast verification", "user details..")

  return user;
};

export const createPasswordReset = async (email: string) => {
  const user = await User.findOne({ email }).select(
    "+password_reset_token +password_reset_expiry +password"
  );
  if (!user) throw new Error("User not found");
  const resetToken = user.generatePasswordReset();

  const otpCode = generateOtpCode();
  user.passwordResetCode = otpCode;
  await user.save();

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
    email
  )}`;
  const htmlTemplate = generateEmail("passwordReset", {
    userName: user.fullName,
    link: resetUrl,
    code: otpCode,
  });
  await sendEmail(email, "Reset your password - MEC Computer Club", htmlTemplate);
  return resetToken;
};

export const resetPassword = async (email: string, token: string, newPassword: string) => {
  const code = token.length === 6 ? token : null;
  let user;
  if (code) {
    user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpiry: { $gt: new Date() },
    }).select("+password");
  } else {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    user = await User.findOne({
      email,
      passwordResetToken: hashed,
      passwordResetExpiry: { $gt: new Date() },
    }).select("+password");
  }
  if (!user) throw new Error("Invalid or expired reset token");

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetCode = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();
  return user;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new Error("User not found");
  if (!user.comparePassword(currentPassword)) throw new Error("Invalid current password");
  user.password = newPassword;
  await user.save();
  return user;
};

export const getUserProfile = async (identifier: string) => {
  let user: IUser | null = null;
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    user = await User.findById(identifier).select(
      "-password -verificationToken -passwordResetToken"
    );
  } else if (identifier.includes("@")) {
    user = await User.findOne({ email: identifier }).select(
      "-password -verificationToken -passwordResetToken"
    );
  } else {
    user = await User.findOne({ studentId: identifier }).select(
      "-password -verificationToken -passwordResetToken"
    );
  }
  if (!user) throw new Error("User not found");
  return user;
};

export const userFromToken = async (tokenPayload: { id: string; email: string; role: string }) => {
  const user = await User.findById(tokenPayload.id).select(
    "-password -verificationToken -passwordResetToken"
  );
  if (!user) throw new Error("User not found");
  return user;
};
