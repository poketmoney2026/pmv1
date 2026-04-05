import mongoose from "mongoose";

const { Schema } = mongoose;

const TRANSACTION_TYPES = [
  "payment",
  "recharge",
  "deposit",
  "withdraw",
  "refund",
  "bonus",
  "cashback",
  "reward",
  "commission",
  "royalty",
  "referralBonus",
  "debit",
  "credit",
  "profit",
  "claim",
  "gift",
  "giveaway",
];

const TRANSACTION_STATUSES = [
  "pending",
  "processing",
  "verifying",
  "successful",
  "hold",
  "reject",
];

const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: "pending",
      index: true,
    },

    amount: { type: Number, required: true },

    note: { type: String, default: "" },

    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// useful compound index for filtering
transactionSchema.index({ user: 1, status: 1, type: 1, date: 1 });

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
