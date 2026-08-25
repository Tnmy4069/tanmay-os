import mongoose, { Schema, Document, Model } from "mongoose";
import {
  LEADERSHIP_CLUBS,
  LEADERSHIP_TASK_STATUSES,
  type LeadershipClub,
  type LeadershipTaskStatus,
} from "@/lib/leadership-constants";

export interface ILeadershipTask extends Document {
  userId: mongoose.Types.ObjectId;
  club: LeadershipClub;
  title: string;
  owner?: string;
  status: LeadershipTaskStatus;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadershipTaskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    club: { type: String, enum: LEADERSHIP_CLUBS, required: true },
    title: { type: String, required: true },
    owner: { type: String },
    status: { type: String, enum: LEADERSHIP_TASK_STATUSES, default: "Todo" },
    dueDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

LeadershipTaskSchema.index({ userId: 1, club: 1, status: 1 });

const LeadershipTask: Model<ILeadershipTask> =
  mongoose.models.LeadershipTask || mongoose.model<ILeadershipTask>("LeadershipTask", LeadershipTaskSchema);

export default LeadershipTask;
