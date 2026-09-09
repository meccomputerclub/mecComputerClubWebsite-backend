import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationType =
  | "approval"
  | "event"
  | "certificate"
  | "message"
  | "security"
  | "announcement"
  | "system";

export type NotificationPriority = "normal" | "high" | "urgent";

export interface INotification extends Document {
  recipient?: Types.ObjectId | null; // specific user ID or null for role/broadcast
  recipientRole?: "all" | "admin" | "moderator" | "executive" | "member"; // for role-based broadcast
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actionLabel?: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date;
  readBy: {
    userId: Types.ObjectId;
    readAt: Date;
  }[];
  dismissedBy: Types.ObjectId[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["all", "admin", "moderator", "executive", "member"],
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "approval",
        "event",
        "certificate",
        "message",
        "security",
        "announcement",
        "system",
      ],
      default: "system",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    actionLabel: {
      type: String,
      trim: true,
      default: "",
    },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    dismissedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal feed querying
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
