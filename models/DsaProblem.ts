import mongoose, { Schema, Document, Model } from "mongoose";
import { DSA_PLATFORMS, DSA_TOPICS } from "@/lib/career-constants";

export interface IDsaProblem extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  url?: string;
  platform: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Solved" | "Attempted" | "Revisit";
  minutes?: number;
  notes?: string;
  solvedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DsaProblemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    url: { type: String },
    platform: { type: String, enum: DSA_PLATFORMS, default: "LeetCode" },
    topic: { type: String, enum: DSA_TOPICS, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    status: { type: String, enum: ["Solved", "Attempted", "Revisit"], default: "Solved" },
    minutes: { type: Number },
    notes: { type: String },
    solvedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

DsaProblemSchema.index({ userId: 1, solvedAt: -1 });
DsaProblemSchema.index({ userId: 1, topic: 1 });

const DsaProblem: Model<IDsaProblem> =
  mongoose.models.DsaProblem || mongoose.model<IDsaProblem>("DsaProblem", DsaProblemSchema);

export default DsaProblem;
