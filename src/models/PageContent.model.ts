import { Schema, model, Document } from "mongoose";

export interface IPageContent extends Document {
  page: string; // "home", "contact", "cp-hub", "about"
  sections: Record<string, any>;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const pageContentSchema = new Schema<IPageContent>(
  {
    page: { type: String, required: true, unique: true, trim: true, lowercase: true },
    sections: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const PageContent = model<IPageContent>("PageContent", pageContentSchema);
