import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpaceNote extends Document {
  userId: mongoose.Types.ObjectId;
  coreSlug: string;
  itemSlug: string;
  notes: string;
}

const SpaceNoteSchema = new Schema<ISpaceNote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coreSlug: { type: String, required: true },
    itemSlug: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

SpaceNoteSchema.index({ userId: 1, coreSlug: 1, itemSlug: 1 }, { unique: true });

const SpaceNote: Model<ISpaceNote> =
  mongoose.models.SpaceNote || mongoose.model<ISpaceNote>("SpaceNote", SpaceNoteSchema);

export default SpaceNote;