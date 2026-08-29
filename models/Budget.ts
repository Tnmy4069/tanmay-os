import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: string;
  categoryName: string;
  /** Budget limit in paise */
  amount: number;
  period: "monthly";
  /** YYYY-MM format — e.g. "2026-08" */
  month: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    period: { type: String, enum: ["monthly"], default: "monthly" },
    month: { type: String, required: true }, // YYYY-MM
  },
  { timestamps: true }
);

// Unique budget per user+category+month
BudgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);

export default Budget;
