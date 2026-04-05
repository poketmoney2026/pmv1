import mongoose from "mongoose";

const { Schema } = mongoose;

const IncomeHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: "income_history" }
);

IncomeHistorySchema.index({ userId: 1, date: -1 });

export default mongoose.models.IncomeHistory ||
  mongoose.model("IncomeHistory", IncomeHistorySchema);
