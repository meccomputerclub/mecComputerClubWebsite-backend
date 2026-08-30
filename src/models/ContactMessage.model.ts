import mongoose, { Schema, model, Document } from "mongoose";

export interface IReply {
  _id?: mongoose.Types.ObjectId;
  body: string;
  repliedBy: mongoose.Types.ObjectId; // User ref
  repliedByName: string;              // Denormalised for display
  sentAt: Date;
}

export interface IContactMessage extends Document {
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    body: { type: String, required: true },
    repliedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    repliedByName: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const contactMessageSchema = new Schema<IContactMessage>(
  {
    senderName: { type: String, required: true, trim: true },
    senderEmail: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: true }
);

export default model<IContactMessage>("ContactMessage", contactMessageSchema);
