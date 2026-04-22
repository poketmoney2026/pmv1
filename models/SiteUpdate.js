import mongoose from "mongoose";

const { Schema } = mongoose;

const SiteUpdateSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    notifyEveryMin: { type: Number, default: 30, min: 1 },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "site_updates" }
);

export default mongoose.models.SiteUpdate || mongoose.model("SiteUpdate", SiteUpdateSchema);
