import { Schema, model, Document, Types } from "mongoose";

export interface IEmailRoutingRecipient {
  email: string;
  label?: string;
}

export interface IEmailRoutingChannel {
  enabled: boolean;
  recipients: IEmailRoutingRecipient[];
}

export interface IEmailRouting extends Document {
  registrationApproval: IEmailRoutingChannel;
  contactMessages: IEmailRoutingChannel;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmailRoutingRecipientSchema = new Schema<IEmailRoutingRecipient>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const EmailRoutingChannelSchema = new Schema<IEmailRoutingChannel>(
  {
    enabled: { type: Boolean, default: true },
    recipients: { type: [EmailRoutingRecipientSchema], default: [] },
  },
  { _id: false }
);

const EmailRoutingSchema = new Schema<IEmailRouting>(
  {
    registrationApproval: {
      type: EmailRoutingChannelSchema,
      default: () => ({ enabled: true, recipients: [] }),
    },
    contactMessages: {
      type: EmailRoutingChannelSchema,
      default: () => ({ enabled: true, recipients: [] }),
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default model<IEmailRouting>("EmailRouting", EmailRoutingSchema);
