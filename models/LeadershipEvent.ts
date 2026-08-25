import mongoose, { Schema, Document, Model } from "mongoose";
import {
  LEADERSHIP_CLUBS,
  LEADERSHIP_EVENT_STATUSES,
  LEADERSHIP_EVENT_TYPES,
  type LeadershipClub,
  type LeadershipEventStatus,
  type LeadershipEventType,
} from "@/lib/leadership-constants";

export interface ILeadershipEvent extends Document {
  userId: mongoose.Types.ObjectId;
  club: LeadershipClub;
  title: string;
  type: LeadershipEventType;
  eventDate: Date;
  location?: string;
  status: LeadershipEventStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadershipEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    club: { type: String, enum: LEADERSHIP_CLUBS, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: LEADERSHIP_EVENT_TYPES, default: "Meeting" },
    eventDate: { type: Date, required: true },
    location: { type: String },
    status: { type: String, enum: LEADERSHIP_EVENT_STATUSES, default: "Planned" },
    notes: { type: String },
  },
  { timestamps: true }
);

LeadershipEventSchema.index({ userId: 1, club: 1, eventDate: 1 });

const LeadershipEvent: Model<ILeadershipEvent> =
  mongoose.models.LeadershipEvent || mongoose.model<ILeadershipEvent>("LeadershipEvent", LeadershipEventSchema);

export default LeadershipEvent;
