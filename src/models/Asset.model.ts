import mongoose, { Schema, Document } from "mongoose";

// 1. Define the Interface (for TypeScript)
export interface IAsset extends Document {
  name: string;
  assetTag: string; // Unique identifier (e.g., INV-001)
  category: "hardware" | "software_license" | "peripheral" | "furniture" | "other";
  purchaseDate: Date;
  purchaseCost: number;
  currentCondition: "excellent" | "good" | "fair" | "poor" | "retired";
  assignedTo?: mongoose.Types.ObjectId; // Reference to the User currently responsible
  location: string; // e.g., "Lab 1", "Server Room", "Cloud Account"
  isAvailable: boolean;
  notes?: string;
}

// 2. Define the Mongoose Schema
const AssetSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
    },
    assetTag: {
      type: String,
      required: [true, "Unique asset tag is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["hardware", "software_license", "peripheral", "furniture", "other"],
      required: [true, "Asset category is required"],
    },
    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
    },
    purchaseCost: {
      type: Number,
      required: [true, "Purchase cost is required"],
      min: 0,
    },
    currentCondition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor", "retired"],
      default: "good",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional: might be unassigned
    },
    location: {
      type: String,
      required: [true, "Asset location is required"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// 3. Export the Model
export const Asset = mongoose.model<IAsset>("Asset", AssetSchema);
