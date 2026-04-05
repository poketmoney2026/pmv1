import mongoose from "mongoose";

const { Schema } = mongoose;

const PAYMENT_METHODS = ["bkash", "nagad", "recharge"];
const ACCOUNT_TYPES = ["personal", "agent", "merchant", "gp", "bl", "robi", "airtel", "teletalk"];

const WithdrawSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    feeAmount: { type: Number, default: 0, min: 0 },
    totalDebit: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "bkash", index: true },
    accountType: { type: String, enum: ACCOUNT_TYPES, default: "personal" },
    mobile: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true, maxlength: 100 },
    paymentProof: { type: String, default: "" },
    status: { type: String, enum: ["pending", "processing", "successful", "reject"], default: "pending", index: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: "withdraws" }
);

WithdrawSchema.index({ userId: 1, createdAt: -1 });
WithdrawSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Withdraw || mongoose.model("Withdraw", WithdrawSchema);
