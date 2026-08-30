import mongoose, { Schema, Document } from "mongoose";

export interface ISponsorshipRecord {
  sponsorshipType: "event" | "duration";
  eventId?: mongoose.Types.ObjectId;
  eventName?: string;   // denormalised for display without populate
  startDate?: Date;
  endDate?: Date;
  contributionType: "monetary" | "in_kind" | "service";
  amountOrValue: number;
  notes?: string;
  createdAt?: Date;
}

export interface ISponsor extends Document {
  name: string;
  logoUrl: string;
  website?: string;
  isActive: boolean;
  contactName?: string;
  contactEmail?: string;
  // All individual sponsorship records (one sponsor can sponsor many times)
  sponsorships: ISponsorshipRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const SponsorshipRecordSchema = new Schema<ISponsorshipRecord>(
  {
    sponsorshipType: {
      type: String,
      enum: ["event", "duration"],
      required: true,
      default: "event",
    },
    eventId: { type: Schema.Types.ObjectId, ref: "Event" },
    eventName: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    contributionType: {
      type: String,
      enum: ["monetary", "in_kind", "service"],
      required: true,
      default: "monetary",
    },
    amountOrValue: { type: Number, default: 0 },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const SponsorSchema: Schema = new Schema(
  {
    name: { type: String, required: [true, "Sponsor name is required"], trim: true },
    logoUrl: { type: String, required: [true, "Sponsor logo URL is required"] },
    website: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    sponsorships: { type: [SponsorshipRecordSchema], default: [] },
  },
  { timestamps: true }
);

export const Sponsor = mongoose.model<ISponsor>("Sponsor", SponsorSchema);
