import mongoose from "mongoose";

const { Schema } = mongoose;

const ReferralIncomeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: "referral_income" }
);

// ✅ ensure one document per user
ReferralIncomeSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.ReferralIncome ||
  mongoose.model("ReferralIncome", ReferralIncomeSchema);
