import mongoose, { Schema, Document } from "mongoose";

export interface ISignatory {
  name: string;
  title: string;
  signatureImageUrl?: string;
}

export interface ICertificateTemplate extends Document {
  name: string;
  description?: string;
  type: "visual" | "html";
  // Custom HTML fields
  htmlContent?: string;
  // Visual Builder fields
  theme: "classic-gold" | "tech-cyan" | "emerald-clean" | "crimson-bold" | "midnight-dark" | "custom-bg";
  backgroundUrl?: string;
  badgeIcon: "award" | "trophy" | "star" | "shield" | "medal" | "code";
  primaryColor: string;
  accentColor: string;
  borderStyle: "neo-brutalist" | "classic-ornate" | "modern-double" | "minimal-clean" | "none";
  headerSubtitle?: string;
  titleText?: string;
  presentationText?: string;
  signatories: ISignatory[];
  footerNote?: string;
  // Association & default
  isDefault: boolean;
  associatedEvent?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SignatorySchema = new Schema<ISignatory>(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    signatureImageUrl: { type: String, trim: true },
  },
  { _id: true }
);

const CertificateTemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["visual", "html"],
      default: "visual",
    },
    // HTML mode content
    htmlContent: { type: String, default: "" },
    // Visual builder fields
    theme: {
      type: String,
      enum: ["classic-gold", "tech-cyan", "emerald-clean", "crimson-bold", "midnight-dark", "custom-bg"],
      default: "emerald-clean",
    },
    backgroundUrl: { type: String, default: "" },
    badgeIcon: {
      type: String,
      enum: ["award", "trophy", "star", "shield", "medal", "code"],
      default: "award",
    },
    primaryColor: { type: String, default: "#0D9488" },
    accentColor: { type: String, default: "#F59E0B" },
    borderStyle: {
      type: String,
      enum: ["neo-brutalist", "classic-ornate", "modern-double", "minimal-clean", "none"],
      default: "neo-brutalist",
    },
    headerSubtitle: {
      type: String,
      default: "MYMENSINGH ENGINEERING COLLEGE COMPUTER CLUB",
      trim: true,
    },
    titleText: {
      type: String,
      default: "Certificate of Excellence",
      trim: true,
    },
    presentationText: {
      type: String,
      default: "PROUDLY PRESENTED TO",
      trim: true,
    },
    signatories: {
      type: [SignatorySchema],
      default: [
        { name: "Executive Committee", title: "MEC Computer Club" },
        { name: "Faculty Advisor", title: "Mymensingh Engineering College" },
      ],
    },
    footerNote: {
      type: String,
      default: "Official credential verified on the MEC Computer Club registry.",
      trim: true,
    },
    isDefault: { type: Boolean, default: false },
    associatedEvent: { type: Schema.Types.ObjectId, ref: "Event" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const CertificateTemplate = mongoose.model<ICertificateTemplate>(
  "CertificateTemplate",
  CertificateTemplateSchema
);
