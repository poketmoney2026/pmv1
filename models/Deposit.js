// models/Deposit.js
import mongoose from "mongoose";

const DepositSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["bkash", "nagad", "rocket", "upay"], required: true },
    verifyMode: { type: String, enum: ["number", "trx", "screenshot"], required: true },
    senderNumber: { type: String, default: "" },
    trxId: { type: String, default: "" },
    screenshotUrl: { type: String, default: "" },
    type: { type: String, enum: ["none", "running", "done"], default: "none" },
    status: { type: String, enum: ["processing", "success", "reject"], default: "processing", index: true },
    note: { type: String, default: "" },
    createdDate: { type: Date, default: null },
    claimDate: { type: Date, default: null },
    processingExpiresAt: { type: Date, default: null, index: true },
    approvedById: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    approvedByRole: { type: String, default: "" },
    approvedByName: { type: String, default: "" },
    creditedMode: { type: String, enum: ["plan", "balance"], default: "plan" },
  },
  { timestamps: true }
);

export default mongoose.models.Deposit || mongoose.model("Deposit", DepositSchema);
