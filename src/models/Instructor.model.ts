import mongoose, { Document, Schema } from "mongoose";

export interface IInstructor extends Document {
  name: string;
  designation: string;
  department: string;
  institution: string;
  status: "approved" | "pending";
  submittedBy?: mongoose.Types.ObjectId | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const instructorSchema: Schema<IInstructor> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Instructor name is required"],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      default: "Lecturer",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    institution: {
      type: String,
      trim: true,
      default: "Mymensingh Engineering College",
    },
    status: {
      type: String,
      enum: ["approved", "pending"],
      default: "pending",
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique instructor name within a department
instructorSchema.index({ name: 1, department: 1 }, { unique: true });
instructorSchema.index({ department: 1, status: 1 });
instructorSchema.index({ name: "text" });

export const Instructor = mongoose.model<IInstructor>("Instructor", instructorSchema);
export default Instructor;
