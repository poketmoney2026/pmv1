import mongoose from "mongoose";

const { Schema } = mongoose;

const EarningTierSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    minBalance: { type: Number, required: true, min: 0 },
    maxBalance: { type: Number, default: null },
    dailyRatePercent: { type: Number, required: true, min: 0 },
    sortOrder: { type: Number, default: 1, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "earning_tiers" }
);

EarningTierSchema.index({ isActive: 1, sortOrder: 1, minBalance: 1 });

export default mongoose.models.EarningTier ||
  mongoose.model("EarningTier", EarningTierSchema);
