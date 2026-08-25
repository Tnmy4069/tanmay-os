import mongoose, { Schema, Document, Model } from "mongoose";

const ItemSchema = new Schema(
  {
    id: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "Folder" },
    href: { type: String, required: true },
    builtIn: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const CoreSchema = new Schema(
  {
    id: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "Folder" },
    builtIn: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    items: { type: [ItemSchema], default: [] },
  },
  { _id: false }
);

export interface ISpaceConfig extends Document {
  userId: mongoose.Types.ObjectId;
  cores: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    builtIn: boolean;
    hidden: boolean;
    order: number;
    items: {
      id: string;
      slug: string;
      name: string;
      icon: string;
      href: string;
      builtIn: boolean;
      hidden: boolean;
      order: number;
    }[];
  }[];
}

const SpaceConfigSchema = new Schema<ISpaceConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cores: { type: [CoreSchema], default: [] },
  },
  { timestamps: true }
);

const SpaceConfig: Model<ISpaceConfig> =
  mongoose.models.SpaceConfig || mongoose.model<ISpaceConfig>("SpaceConfig", SpaceConfigSchema);

export default SpaceConfig;