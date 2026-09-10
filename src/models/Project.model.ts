import mongoose, { Schema, Document } from "mongoose";

// 1. Define the Interface (for TypeScript)
export interface IProject extends Document {
  title: string;
  slug?: string;
  description: string;
  status: "planning" | "in_progress" | "completed" | "on_hold" | "archived";
  startDate?: Date;
  endDate?: Date;
  githubLink?: string;
  liveDemoLink?: string;
  teamMembers: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  department?: string;
  requiredSkills: string[];
  techStack?: string[];
  imageUrl?: string;
  imagePublicId?: string;
  featured?: boolean;
}

// 2. Define the Mongoose Schema
const ProjectSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["planning", "in_progress", "completed", "on_hold", "archived"],
      default: "planning",
      required: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: false,
    },
    githubLink: {
      type: String,
      required: false,
      default: "",
    },
    liveDemoLink: {
      type: String,
      required: false,
      default: "",
    },
    teamMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Links to your User model
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: String,
      default: "webdev",
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    techStack: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: "",
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

ProjectSchema.index({ featured: -1, createdAt: -1 });
ProjectSchema.index({ department: 1, createdAt: -1 });

// 3. Export the Model
export const Project = mongoose.model<IProject>("Project", ProjectSchema);
