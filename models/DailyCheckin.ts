import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyCheckin extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date; // normalized to midnight IST
  followedRoutine: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyCheckinSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    followedRoutine: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

DailyCheckinSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyCheckin: Model<IDailyCheckin> =
  mongoose.models.DailyCheckin ||
  mongoose.model<IDailyCheckin>("DailyCheckin", DailyCheckinSchema);

export default DailyCheckin;
