import mongoose, { Schema, Document, Model } from "mongoose";
import { CTF_RESULTS, type CtfResult } from "@/lib/leadership-constants";

export interface ICtfChallenge extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category?: string;
  platform?: string;
  result: CtfResult;
  eventDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CtfChallengeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String },
    platform: { type: String },
    result: { type: String, enum: CTF_RESULTS, default: "Attempted" },
    eventDate: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

CtfChallengeSchema.index({ userId: 1, eventDate: -1 });

const CtfChallenge: Model<ICtfChallenge> =
  mongoose.models.CtfChallenge || mongoose.model<ICtfChallenge>("CtfChallenge", CtfChallengeSchema);

export default CtfChallenge;
