import { Schema, model, Document } from "mongoose";

export interface ICustomPage extends Document {
  title: string;
  slug: string;
  description?: string;
  content: string;
  coverImageUrl?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomPageSchema = new Schema<ICustomPage>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CustomPage = model<ICustomPage>("CustomPage", CustomPageSchema);
