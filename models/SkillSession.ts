import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISkillSession extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  minutes: number;
  sessionDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "SkillCourse", required: true },
    minutes: { type: Number, required: true, min: 1 },
    sessionDate: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

SkillSessionSchema.index({ userId: 1, sessionDate: -1 });

const SkillSession: Model<ISkillSession> =
  mongoose.models.SkillSession || mongoose.model<ISkillSession>("SkillSession", SkillSessionSchema);

export default SkillSession;
