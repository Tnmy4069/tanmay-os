import mongoose, { Schema, Document, Model } from "mongoose";
import { IITM_COURSE_STATUSES, type IitmCourseStatus } from "@/lib/education-constants";

export interface IIitmCourse extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  code?: string;
  term: string;
  credits: number;
  status: IitmCourseStatus;
  grade?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IitmCourseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    code: { type: String },
    term: { type: String, required: true },
    credits: { type: Number, default: 4 },
    status: { type: String, enum: IITM_COURSE_STATUSES, default: "In Progress" },
    grade: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

IitmCourseSchema.index({ userId: 1, term: 1 });

const IitmCourse: Model<IIitmCourse> =
  mongoose.models.IitmCourse || mongoose.model<IIitmCourse>("IitmCourse", IitmCourseSchema);

export default IitmCourse;
