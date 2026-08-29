import mongoose, { Schema, Document, Model } from "mongoose";

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Wallet",
  "Cheque",
  "Other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  /** Amount in paise (integer). 100 paise = ₹1. Never use float. */
  amount: number;
  date: Date;
  description: string;
  categoryId?: string; // matches FinancialCategory._id (string for simplicity)
  categoryName?: string; // denormalised for fast display
  subcategory?: string;
  paymentMethod: PaymentMethod;
  tags: string[];
  notes?: string;
  isRecurring: boolean;
  recurringTemplateId?: mongoose.Types.ObjectId;
  relatedGoalId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 1 }, // paise, integer only
    date: { type: Date, required: true },
    description: { type: String, required: true },
    categoryId: { type: String },
    categoryName: { type: String },
    subcategory: { type: String },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "UPI",
    },
    tags: [{ type: String }],
    notes: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringTemplateId: { type: Schema.Types.ObjectId, ref: "RecurringTemplate" },
    relatedGoalId: { type: Schema.Types.ObjectId, ref: "FinancialGoal" },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
TransactionSchema.index({ userId: 1, recurringTemplateId: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
