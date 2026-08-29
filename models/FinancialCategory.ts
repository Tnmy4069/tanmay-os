import mongoose, { Schema, Document, Model } from "mongoose";
import type { TransactionType } from "./Transaction";

export interface IFinancialCategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  icon: string; // emoji or lucide icon name
  color: string; // hex
  type: TransactionType | "both";
  isDefault: boolean; // seeded defaults
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialCategorySchema = new Schema<IFinancialCategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "💰" },
    color: { type: String, default: "#58cc02" },
    type: { type: String, enum: ["income", "expense", "both"], required: true },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FinancialCategorySchema.index({ userId: 1, type: 1, order: 1 });

const FinancialCategory: Model<IFinancialCategory> =
  mongoose.models.FinancialCategory ||
  mongoose.model<IFinancialCategory>("FinancialCategory", FinancialCategorySchema);

export default FinancialCategory;
