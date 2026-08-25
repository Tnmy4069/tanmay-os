import mongoose, { Schema, Document, Model } from "mongoose";
import {
  IITM_DEADLINE_STATUSES,
  IITM_DEADLINE_TYPES,
  type IitmDeadlineStatus,
  type IitmDeadlineType,
} from "@/lib/education-constants";

export interface IIitmDeadline extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  type: IitmDeadlineType;
  dueDate: Date;
  status: IitmDeadlineStatus;
  score?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IitmDeadlineSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "IitmCourse", required: true },
    title: { type: String, required: true },
    type: { type: String, enum: IITM_DEADLINE_TYPES, default: "Assignment" },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: IITM_DEADLINE_STATUSES, default: "Todo" },
    score: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

IitmDeadlineSchema.index({ userId: 1, dueDate: 1 });

const IitmDeadline: Model<IIitmDeadline> =
  mongoose.models.IitmDeadline || mongoose.model<IIitmDeadline>("IitmDeadline", IitmDeadlineSchema);

export default IitmDeadline;
