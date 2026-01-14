import mongoose, { Schema, Document } from "mongoose";

// 1. Define the Interface (for TypeScript)
export interface IProject extends Document {
  title: string;
  description: string;
  status: "planning" | "in_progress" | "completed" | "on_hold" | "archived";
  startDate: Date;
  endDate?: Date; // Optional for in-progress projects
  githubLink?: string;
  liveDemoLink?: string;
  teamMembers: mongoose.Types.ObjectId[]; // Reference to Users who participated
  requiredSkills: string[];
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
    startDate: {
      type: Date,
      required: [true, "Project start date is required"],
    },
    endDate: {
      type: Date,
      required: false,
    },
    githubLink: {
      type: String,
      required: false,
    },
    liveDemoLink: {
      type: String,
      required: false,
    },
    teamMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Links to your User model
      },
    ],
    requiredSkills: {
      type: [String], // e.g., ['Node.js', 'React', 'MongoDB']
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// 3. Export the Model
export const Project = mongoose.model<IProject>("Project", ProjectSchema);
