import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: "Inbox" | "Not Started" | "In Progress" | "Blocked" | "Done" | "Cancelled";
  priority: "P0 Critical" | "P1 High" | "P2 Medium" | "P3 Low";
  tier: "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
  category?: string;
  project?: string;
  dueDate?: Date;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  energy: "Low" | "Medium" | "High";
  recurring: boolean;
  recurrenceRule?: string;
  tags: string[];
  notes?: string;
  completedAt?: Date;
  isMustDo: boolean; // Flag to easily identify MUST DO tasks for today
  overrideScheduleConflict?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["Inbox", "Not Started", "In Progress", "Blocked", "Done", "Cancelled"],
      default: "Inbox",
    },
    priority: {
      type: String,
      enum: ["P0 Critical", "P1 High", "P2 Medium", "P3 Low"],
      default: "P2 Medium",
    },
    tier: {
      type: String,
      enum: ["Tier 1", "Tier 2", "Tier 3", "Tier 4"],
      required: true,
    },
    category: { type: String },
    project: { type: String },
    dueDate: { type: Date },
    startTime: { type: String }, // e.g., "19:45"
    endTime: { type: String }, // e.g., "20:45"
    estimatedMinutes: { type: Number },
    actualMinutes: { type: Number },
    energy: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    recurring: { type: Boolean, default: false },
    recurrenceRule: { type: String },
    tags: [{ type: String }],
    notes: { type: String },
    completedAt: { type: Date },
    isMustDo: { type: Boolean, default: false },
    overrideScheduleConflict: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for common queries
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, isMustDo: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
