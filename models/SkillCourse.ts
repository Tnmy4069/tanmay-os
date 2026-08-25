import mongoose, { Schema, Document, Model } from "mongoose";
import { SKILL_PLATFORMS, SKILL_STATUSES, type SkillStatus } from "@/lib/education-constants";

export interface ISkillCourse extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  platform: string;
  category?: string;
  status: SkillStatus;
  progress: number;
  hoursLogged: number;
  url?: string;
  notes?: string;
  lastStudiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillCourseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    platform: { type: String, enum: SKILL_PLATFORMS, default: "Other" },
    category: { type: String },
    status: { type: String, enum: SKILL_STATUSES, default: "In Progress" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    hoursLogged: { type: Number, default: 0, min: 0 },
    url: { type: String },
    notes: { type: String },
    lastStudiedAt: { type: Date },
  },
  { timestamps: true }
);

SkillCourseSchema.index({ userId: 1, status: 1 });

const SkillCourse: Model<ISkillCourse> =
  mongoose.models.SkillCourse || mongoose.model<ISkillCourse>("SkillCourse", SkillCourseSchema);

export default SkillCourse;
