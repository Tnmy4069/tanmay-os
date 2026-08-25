import mongoose, { Schema, Document, Model } from "mongoose";
import { LEADERSHIP_CLUBS, type LeadershipClub } from "@/lib/leadership-constants";

export interface ILeadershipMember extends Document {
  userId: mongoose.Types.ObjectId;
  club: LeadershipClub;
  name: string;
  role: string;
  contact?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadershipMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    club: { type: String, enum: LEADERSHIP_CLUBS, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    contact: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

LeadershipMemberSchema.index({ userId: 1, club: 1, name: 1 });

const LeadershipMember: Model<ILeadershipMember> =
  mongoose.models.LeadershipMember || mongoose.model<ILeadershipMember>("LeadershipMember", LeadershipMemberSchema);

export default LeadershipMember;
