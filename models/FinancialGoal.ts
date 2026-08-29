import mongoose, { Schema, Document, Model } from "mongoose";

export type GoalStatus = "active" | "achieved" | "paused";

export interface IFinancialGoal extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  icon: string; // emoji
  color: string; // hex
  /** Target amount in paise */
  targetAmount: number;
  /** Current saved amount in paise — updated on each contribution */
  currentAmount: number;
  deadline?: Date;
  status: GoalStatus;
  achievedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialGoalSchema = new Schema<IFinancialGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: "🎯" },
    color: { type: String, default: "#58cc02" },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["active", "achieved", "paused"],
      default: "active",
    },
    achievedAt: { type: Date },
  },
  { timestamps: true }
);

FinancialGoalSchema.index({ userId: 1, status: 1 });

const FinancialGoal: Model<IFinancialGoal> =
  mongoose.models.FinancialGoal ||
  mongoose.model<IFinancialGoal>("FinancialGoal", FinancialGoalSchema);

export default FinancialGoal;
