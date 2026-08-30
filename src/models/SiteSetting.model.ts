import { Schema, model, Document } from "mongoose";

export interface ISiteSetting extends Document {
  key: string;
  value: string;
  label: string;
  description?: string;
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, default: "" },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export default model<ISiteSetting>("SiteSetting", siteSettingSchema);
