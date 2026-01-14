import mongoose, { Schema, Document } from "mongoose";

// 1. Define the Interface (for TypeScript)
export interface ICertificate extends Document {
  name: string;
  description?: string;
  recipient: mongoose.Types.ObjectId; // Reference to the User who earned it
  associatedEvent?: mongoose.Types.ObjectId; // Optional link to the Event/Activity
  issueDate: Date;
  certificateId: string; // Unique ID for verification (e.g., hash or sequential ID)
  digitalUrl: string; // Link to the publicly verifiable PDF or image
}

// 2. Define the Mongoose Schema
const CertificateSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Certificate name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Certificate recipient is required"],
    },
    associatedEvent: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: false,
    },
    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
    },
    certificateId: {
      type: String,
      required: [true, "Verification ID is required"],
      unique: true, // Ensures each certificate is uniquely verifiable
    },
    digitalUrl: {
      type: String,
      required: [true, "Digital certificate URL is required"],
    },
  },
  {
    timestamps: true,
  }
);

// 3. Export the Model
export const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);
