import mongoose, { Schema, Document, Model } from "mongoose";
import { APTITUDE_CATEGORIES } from "@/lib/career-constants";

export interface IAptitudeSession extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  topic?: string;
  attempted: number;
  correct: number;
  minutes?: number;
  notes?: string;
  sessionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AptitudeSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: APTITUDE_CATEGORIES, required: true },
    topic: { type: String },
    attempted: { type: Number, required: true, min: 0 },
    correct: { type: Number, required: true, min: 0 },
    minutes: { type: Number },
    notes: { type: String },
    sessionDate: { type: Date, required: true },
  },
  { timestamps: true }
);

AptitudeSessionSchema.index({ userId: 1, sessionDate: -1 });

const AptitudeSession: Model<IAptitudeSession> =
  mongoose.models.AptitudeSession || mongoose.model<IAptitudeSession>("AptitudeSession", AptitudeSessionSchema);

export default AptitudeSession;
