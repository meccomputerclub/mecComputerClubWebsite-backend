import { Schema, model, Document } from "mongoose";

export type InvitationStatus = "consumable" | "consumed" | "expired" | "cancelled";

export interface IInvitationCode extends Document {
  code: string; // 6-char unique code
  email: string; // Target user email

  // Optional fields
  formId?: string; // Reference to membership form (submitted data)
  role?: "guest" | "member" | "moderator" | "admin" | "alumni";

  status: InvitationStatus;
  expiresAt: Date; // Expiration timestamp

  createdAt: Date;
  updatedAt: Date;
}

const InvitationCodeSchema = new Schema<IInvitationCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      length: 6,
      index: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email is already in use"],
    },

    formId: {
      type: String,
    },

    role: {
      type: String,
      enum: ["guest", "member", "moderator", "admin", "alumni"],
      default: "member",
    },

    status: {
      type: String,
      enum: ["consumable", "consumed", "expired", "cancelled"],
      default: "consumable",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Automatically expire codes in MongoDB (optional)
InvitationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IInvitationCode>("InvitationCode", InvitationCodeSchema);
