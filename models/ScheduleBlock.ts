import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScheduleBlock extends Document {
  userId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // e.g., "07:15"
  endTime: string;   // e.g., "08:00"
  title: string;
  type: "Fixed" | "Focus" | "Personal" | "Commute" | "Work" | "Sleep" | "Relationship" | "Fitness" | "Free";
  category?: string;
  isFixed: boolean;
  allowOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleBlockSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["Fixed", "Focus", "Personal", "Commute", "Work", "Sleep", "Relationship", "Fitness", "Free"],
      required: true,
    },
    category: { type: String },
    isFixed: { type: Boolean, default: true },
    allowOverride: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ScheduleBlockSchema.index({ userId: 1, dayOfWeek: 1, startTime: 1 });

const ScheduleBlock: Model<IScheduleBlock> = mongoose.models.ScheduleBlock || mongoose.model<IScheduleBlock>("ScheduleBlock", ScheduleBlockSchema);

export default ScheduleBlock;
