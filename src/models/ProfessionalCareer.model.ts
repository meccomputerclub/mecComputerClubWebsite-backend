import mongoose, { Schema, Document } from "mongoose";

// 1. Define the Interface (for TypeScript)
export interface IProfessionalCareer extends Document {
  user: mongoose.Types.ObjectId; // Link back to the Alumni/User
  companyName: string;
  jobTitle: string;
  startDate: Date;
  endDate?: Date; // Optional, if currently working there
  isCurrent: boolean;
  description?: string; // Key responsibilities or achievements
  industry: string;
  location: string; // City, Country
}

// 2. Define the Mongoose Schema
const ProfessionalCareerSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required to link career history"],
      index: true, // Indexing on 'user' improves query speed for fetching a user's career history
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: false,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: false,
    },
    industry: {
      type: String,
      required: [true, "Industry is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 3. Export the Model
export const ProfessionalCareer = mongoose.model<IProfessionalCareer>(
  "ProfessionalCareer",
  ProfessionalCareerSchema
);
