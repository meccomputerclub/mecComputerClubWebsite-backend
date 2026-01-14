import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IUser extends Document {
  email: string;
  password: string;
  isVerified: boolean;
  verificationCode?: string | null;
  verificationToken?: string | null;
  verificationTokenExpiry?: Date | null;
  emailVerifiedAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetCode?: string | null;
  passwordResetExpiry?: Date | null;

  fullName: string;
  studentId: string;
  session?: string;
  batch?: string;
  department?: string;
  isGraduated: boolean;
  passingYear?: number;
  clubId?: string | null;

  contactNumber?: string;
  address?: string;
  bio?: string;
  imageUrl?: string;
  imagePublicId?: string;

  socialLinks?: {
    facebook?: string;
    github?: string;
    linkedin?: string;
  };

  role: "guest" | "member" | "moderator" | "admin" | "alumni";
  applicationStatus: "pending" | "approved" | "rejected";
  profileStatus?: "incomplete" | "active" | "deleted" | "banned";

  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;

  requestedFastVerificationCount: number;
  lastFastVerificationRequest?: Date | null;

  currentProfessionalCareer?: mongoose.Types.ObjectId;
  eventsAttended?: mongoose.Types.ObjectId[];
  certificates?: mongoose.Types.ObjectId[];
  projectsContributed?: mongoose.Types.ObjectId[];
  lastLogin?: Date | null;

  comparePassword(candidate: string): Promise<boolean>;
  generateEmailVerification(): { token: string; code: string };
  generatePasswordReset(): string;
}

const userSchema: Schema<IUser> = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    // verification
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationToken: String,
    verificationTokenExpiry: Date,
    emailVerifiedAt: Date,

    passwordResetToken: String,
    passwordResetCode: String,
    passwordResetExpiry: Date,

    fullName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, unique: true },
    session: { type: String, required: true },
    batch: { type: String, required: true },
    department: { type: String, required: true },
    isGraduated: { type: Boolean, default: false },
    passingYear: Number,
    currentProfessionalCareer: {
      type: Schema.Types.ObjectId,
      ref: "ProfessionalCareer",
      default: null,
    },

    contactNumber: { type: String, required: true },
    address: String,
    bio: String,
    imageUrl: { type: String, default: null, required: true },
    imagePublicId: String,

    socialLinks: { facebook: String, github: String, linkedin: String },

    role: {
      type: String,
      enum: ["guest", "member", "moderator", "admin", "alumni"],
      default: "guest",
    },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    profileStatus: {
      type: String,
      enum: ["incomplete", "active", "deleted", "banned"],
      default: "incomplete",
    },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: Date,
    rejectionReason: String,

    requestedFastVerificationCount: { type: Number, default: 0 },
    lastFastVerificationRequest: Date,

    eventsAttended: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    certificates: [{ type: Schema.Types.ObjectId, ref: "Certificate" }],
    projectsContributed: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    lastLogin: Date,
  },
  { timestamps: true }
);

// password hashing
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

function checkProfileCompletion(doc: any): boolean {
  const isEmailValid = !!doc.email && doc.email.trim() !== "";
  const isFullNameValid = !!doc.fullName && doc.fullName.trim() !== "";
  const isSessionValid = !!doc.session && doc.session.trim() !== "";
  const isStudentIdValid = !!doc.studentId && doc.studentId.trim() !== "";
  const isDepartmentValid = !!doc.department && doc.department.trim() !== "";
  const isBatchValid = !!doc.batch && doc.batch.trim() !== "";
  const isGraduatedValid = typeof doc.isGraduated === "boolean";
  const isImageUrlValid = !!doc.imageUrl && doc.imageUrl.trim() !== "";
  const isContactNumberValid = !!doc.contactNumber && doc.contactNumber.trim() !== "";
  const isAddressValid = !!doc.address && doc.address.trim() !== "";
  const isBioValid = !!doc.bio && doc.bio.trim() !== "";

  const hasAtLeastOneSocialLink = !!(
    (doc.socialLinks?.facebook && doc.socialLinks.facebook.trim() !== "") ||
    (doc.socialLinks?.github && doc.socialLinks.github.trim() !== "") ||
    (doc.socialLinks?.linkedin && doc.socialLinks.linkedin.trim() !== "")
  );

  return (
    isEmailValid &&
    isFullNameValid &&
    isSessionValid &&
    isStudentIdValid &&
    isDepartmentValid &&
    isBatchValid &&
    isGraduatedValid &&
    isImageUrlValid &&
    isContactNumberValid &&
    isAddressValid &&
    isBioValid &&
    hasAtLeastOneSocialLink
  );
}

// Pre-save hook for direct save operations
userSchema.pre("save", function (next) {
  if (
    (this.profileStatus === "incomplete" || this.profileStatus === "active") &&
    checkProfileCompletion(this)
  ) {
    this.profileStatus = "active";
  } else {
    this.profileStatus = "incomplete";
  }
  next();
});

// Pre-findOneAndUpdate hook to check and update status BEFORE the update happens
userSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() as any;

    // Skip if profileStatus is explicitly being set to something other than incomplete
    if (update.$set?.profileStatus === "banned" || update.$set?.profileStatus === "deleted") {
      return next();
    }

    // Get the current document
    const docToUpdate = await this.model.findOne(this.getQuery());

    if (
      !docToUpdate ||
      docToUpdate.profileStatus === "banned" ||
      docToUpdate.profileStatus === "deleted"
    ) {
      return next();
    }

    // Merge current document with the updates
    const mergedDoc = {
      ...docToUpdate.toObject(),
      ...(update.$set || {}),
    };

    // Handle nested updates for socialLinks
    if (update.$set?.socialLinks) {
      mergedDoc.socialLinks = {
        ...docToUpdate.socialLinks,
        ...update.$set.socialLinks,
      };
    }

    // Check if profile will be complete after update
    if (checkProfileCompletion(mergedDoc)) {
      if (!update.$set) {
        update.$set = {};
      }
      update.$set.profileStatus = "active";
    } else {
      if (!update.$set) {
        update.$set = {};
      }
      update.$set.profileStatus = "incomplete";
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (candidate: string) {
  // this.password is not selected by default in queries; ensure .select('+password') when needed
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateEmailVerification = function () {
  const token = crypto.randomBytes(20).toString("hex");
  // store hashed token
  this.verificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.verificationTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  // also create a short numeric code (6 digits)
  this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  return { token, code: this.verificationCode };
};

userSchema.methods.generatePasswordReset = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000);
  return resetToken;
};

export default mongoose.model<IUser>("User", userSchema);
