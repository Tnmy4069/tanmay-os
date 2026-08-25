import mongoose, { Schema, Document, Model } from "mongoose";
import { JOB_STATUSES, type JobStatus } from "@/lib/career-constants";

export type { JobStatus };
export { JOB_STATUSES };

export interface IJobApplication extends Document {
  userId: mongoose.Types.ObjectId;
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  status: JobStatus;
  source?: string;
  appliedAt?: Date;
  nextDate?: Date;
  salary?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: { type: String },
    jobUrl: { type: String },
    status: { type: String, enum: JOB_STATUSES, default: "Wishlist" },
    source: { type: String },
    appliedAt: { type: Date },
    nextDate: { type: Date },
    salary: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ userId: 1, status: 1, updatedAt: -1 });

const JobApplication: Model<IJobApplication> =
  mongoose.models.JobApplication || mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);

export default JobApplication;
