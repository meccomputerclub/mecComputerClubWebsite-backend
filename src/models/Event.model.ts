import mongoose, { Schema, Document } from "mongoose";

export interface IWinner {
  teamName?: string;                          // optional team name
  members: mongoose.Types.ObjectId[];         // 1–N members in the team
  position: string;                           // "1st Place", "Best Design", etc.
  prize?: string;
}

export interface IPendingParticipant {
  userId: mongoose.Types.ObjectId;
  registeredAt: Date;
  formData?: Record<string, any>;
}

export interface IEventSponsor {
  sponsorId: mongoose.Types.ObjectId;
  sponsorName: string;
  logoUrl?: string;
  tier?: string; // "Gold", "Silver", "Bronze", "Partner"
}

export interface IEvent extends Document {
  title: string;
  slug?: string;
  description: string;
  date: Date;
  endDate?: Date;
  eventTime?: string;
  location: string;
  onlineLink?: string;
  category: "workshop" | "seminar" | "contest" | "conference" | "hackathon" | "social" | "other";
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "postponed";
  isUpcoming?: boolean;
  // Registration
  registrationLink?: string;
  registrationDeadline?: Date;
  maxParticipants?: number;
  registrationFee?: number;
  // Media
  coverImageUrl?: string;
  bannerImageUrl?: string;
  // Organiser
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Tags & visibility
  tags: string[];
  isPublished: boolean;
  // Custom HTML section
  customHtmlSection?: string;
  // Participants
  attendees: mongoose.Types.ObjectId[];           // approved participants
  pendingParticipants: IPendingParticipant[];      // awaiting admin approval
  // Winners (for contests/hackathons)
  winners: IWinner[];
  // Sponsors linked to this event
  eventSponsors: IEventSponsor[];
  // Relations
  media: mongoose.Types.ObjectId[];
  certificates: mongoose.Types.ObjectId[];
  projects: mongoose.Types.ObjectId[];
  forms: mongoose.Types.ObjectId[];
}

const WinnerSchema = new Schema<IWinner>({
  teamName: { type: String, trim: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  position: { type: String, required: true, trim: true },
  prize: { type: String, trim: true },
}, { _id: true });

const PendingParticipantSchema = new Schema<IPendingParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  registeredAt: { type: Date, default: Date.now },
  formData: { type: Schema.Types.Mixed },
}, { _id: true });

const EventSponsorSchema = new Schema<IEventSponsor>({
  sponsorId: { type: Schema.Types.ObjectId, ref: "Sponsor", required: true },
  sponsorName: { type: String, required: true, trim: true },
  logoUrl: { type: String },
  tier: { type: String, trim: true },
}, { _id: true });

const EventSchema: Schema = new Schema(
  {
    title: { type: String, required: [true, "Event title is required"], trim: true },
    slug: { type: String, trim: true, index: true },
    description: { type: String, required: [true, "Event description is required"], trim: true },
    date: { type: Date, required: [true, "Event date is required"], index: true },
    endDate: { type: Date },
    eventTime: { type: String },
    location: { type: String, required: [true, "Event location is required"], trim: true },
    onlineLink: { type: String },
    category: {
      type: String,
      enum: ["workshop", "seminar", "contest", "conference", "hackathon", "social", "other"],
      default: "seminar",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled", "postponed"],
      default: "scheduled",
    },
    registrationLink: { type: String },
    registrationDeadline: { type: Date },
    maxParticipants: { type: Number },
    registrationFee: { type: Number, default: 0 },
    coverImageUrl: { type: String },
    bannerImageUrl: { type: String },
    organizer: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: true },
    customHtmlSection: { type: String },
    // Participants
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    pendingParticipants: { type: [PendingParticipantSchema], default: [] },
    // Winners
    winners: { type: [WinnerSchema], default: [] },
    // Sponsors
    eventSponsors: { type: [EventSponsorSchema], default: [] },
    // Relations
    media: [{ type: Schema.Types.ObjectId, ref: "Media" }],
    certificates: [{ type: Schema.Types.ObjectId, ref: "Certificate" }],
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    forms: [{ type: Schema.Types.ObjectId, ref: "Form" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

EventSchema.virtual("isUpcoming").get(function (this: IEvent) {
  return this.date > new Date();
});

export const Event = mongoose.model<IEvent>("Event", EventSchema);
