import { Schema, model, Types } from "mongoose";

export interface IFormSubmission {
  formId: Types.ObjectId;
  userId?: Types.ObjectId;
  responses: Record<string, any>;
}

const SubmissionSchema = new Schema<IFormSubmission>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    responses: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default model<IFormSubmission>("FormSubmission", SubmissionSchema);
