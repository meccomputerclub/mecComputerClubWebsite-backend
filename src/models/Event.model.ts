import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  eventTime?: string;
  location: string;
  category: "workshop" | "seminar" | "contest" | "conference" | "hackathon" | "social" | "other";
  status?: "scheduled" | "ongoing" | "completed" | "cancelled" | "postponed";
  registrationLink?: string;
  attendees: mongoose.Types.ObjectId[];
  media?: mongoose.Types.ObjectId[];
  certificates?: mongoose.Types.ObjectId[];
  projects?: mongoose.Types.ObjectId[];
  forms?: mongoose.Types.ObjectId[];
}

// 2. Define the Mongoose Schema
const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date and time are required"],
      index: true,
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["workshop", "seminar", "contest", "conference", "hackathon", "social", "other"],
      default: "seminar",
      required: true,
      index: true,
    },
    registrationLink: {
      type: String,
      // match: [/^https?:\/\/.+/, "Please use a valid URL"],
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Links to your User model
      },
    ],
    media: [
      {
        type: Schema.Types.ObjectId,
        ref: "Media", // Links to your Media model
      },
    ],
    certificates: [
      {
        type: Schema.Types.ObjectId,
        ref: "Certificate", // Links to your Certificate model
      },
    ],
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project", // Links to your Project model
      },
    ],
    forms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Form", // Links to your Form model
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled", "postponed"],
      default: "scheduled",
    },
    eventTime: {
      type: String,
    },
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

// 3. Export the Model
export const Event = mongoose.model<IEvent>("Event", EventSchema);
