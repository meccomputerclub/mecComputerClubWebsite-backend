import mongoose, { Schema, Document } from "mongoose";

// 1. Define the Interface (for TypeScript)
export interface ISponsor extends Document {
  name: string;
  logoUrl: string; // URL of the sponsor's logo (can be Cloudinary URL)
  website: string;
  contributionType: "monetary" | "in_kind" | "service"; // e.g., Cash, Equipment, Web Hosting
  amountOrValue: number; // Contribution amount in monetary terms (0 if purely service)
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  contactName: string;
  contactEmail: string;
  notes?: string;
}

// 2. Define the Mongoose Schema
const SponsorSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Sponsor name is required"],
      trim: true,
    },
    logoUrl: {
      type: String,
      required: [true, "Sponsor logo URL is required"],
    },
    website: {
      type: String,
      required: false,
      trim: true,
    },
    contributionType: {
      type: String,
      enum: ["monetary", "in_kind", "service"],
      required: [true, "Contribution type is required"],
    },
    amountOrValue: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: [true, "Sponsorship start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Sponsorship end date is required"],
    },
    contactName: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// 3. Export the Model
export const Sponsor = mongoose.model<ISponsor>("Sponsor", SponsorSchema);
