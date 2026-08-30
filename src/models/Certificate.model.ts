import mongoose, { Schema, Document } from "mongoose";

export interface ICertificate extends Document {
  name: string;
  description?: string;
  recipient: mongoose.Types.ObjectId;
  associatedEvent?: mongoose.Types.ObjectId;
  issueDate: Date;
  certificateId: string;
  digitalUrl: string;
  type: "participation" | "winner" | "completion" | "achievement" | "other";
  position?: string; // for winner certificates: "1st Place", etc.
  issuedBy?: mongoose.Types.ObjectId; // admin who issued it
}

const CertificateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    associatedEvent: { type: Schema.Types.ObjectId, ref: "Event" },
    issueDate: { type: Date, required: true },
    certificateId: { type: String, required: true, unique: true },
    digitalUrl: { type: String, required: true },
    type: {
      type: String,
      enum: ["participation", "winner", "completion", "achievement", "other"],
      default: "participation",
    },
    position: { type: String, trim: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);
