import mongoose, { Document, Schema } from "mongoose";

export interface ICourse extends Document {
  courseName: string;
  courseCode: string;
  courseCredit?: string;
  department: string;
  status: "approved" | "pending";
  submittedBy?: mongoose.Types.ObjectId | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema: Schema<ICourse> = new Schema(
  {
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    courseCode: {
      type: String,
      required: [true, "Course code is required"],
      trim: true,
    },
    courseCredit: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
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

// Course code is unique per department (reusable across departments)
courseSchema.index({ courseCode: 1, department: 1 }, { unique: true });
courseSchema.index({ department: 1, status: 1 });
courseSchema.index({ courseName: "text", courseCode: "text" });

export const Course = mongoose.model<ICourse>("Course", courseSchema);
export default Course;
