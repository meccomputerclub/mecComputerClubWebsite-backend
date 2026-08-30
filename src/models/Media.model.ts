import mongoose, { Schema, Document } from "mongoose";

// 1. Define the Interface (for TypeScript)
export interface IMedia extends Document {
  title: string;
  description?: string;
  url: string;
  mediaType: "image" | "video" | "document" | "other";
  fileSize: number;
  uploader: mongoose.Types.ObjectId;
  relatedEvent?: mongoose.Types.ObjectId;
  tags: string[];
  imagePublicId?: string; // Cloudinary public_id — used for deletion
}

// 2. Define the Mongoose Schema
const MediaSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Media title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Media URL is required"],
      unique: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "document", "other"],
      required: [true, "Media type is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    uploader: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assumes your User model is named 'User'
      required: true,
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: "Event", // Assumes you create an Event model
      required: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    imagePublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 3. Export the Model
export const Media = mongoose.model<IMedia>("Media", MediaSchema);
