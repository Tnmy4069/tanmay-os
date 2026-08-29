import mongoose, { Schema, Document, Model } from "mongoose";
import type { TransactionType, PaymentMethod } from "./Transaction";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface IRecurringTemplate extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  /** Amount in paise */
  amount: number;
  description: string;
  categoryId?: string;
  categoryName?: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  /** 1-28 for monthly, 0=Sun-6=Sat for weekly */
  dayOfMonth?: number;
  dayOfWeek?: number;
  /** Next scheduled due date */
  nextDue: Date;
  isActive: boolean;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTemplateSchema = new Schema<IRecurringTemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 1 },
    description: { type: String, required: true },
    categoryId: { type: String },
    categoryName: { type: String },
    paymentMethod: { type: String, enum: ["Cash", "UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet", "Cheque", "Other"], default: "UPI" },
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"], required: true },
    dayOfMonth: { type: Number, min: 1, max: 28 },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    nextDue: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    endDate: { type: Date },
  },
  { timestamps: true }
);

RecurringTemplateSchema.index({ userId: 1, isActive: 1, nextDue: 1 });

const RecurringTemplate: Model<IRecurringTemplate> =
  mongoose.models.RecurringTemplate ||
  mongoose.model<IRecurringTemplate>("RecurringTemplate", RecurringTemplateSchema);

export default RecurringTemplate;
