import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    inactiveReason: { type: String, default: "" },
    balance: { type: Number, default: 0 },
    referralCode: { type: String, default: "" },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    referrals: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    referralBonus: { type: Boolean, default: false },
    joinDate: { type: Date, default: Date.now },
    timerStartedAt: { type: Date, default: Date.now, index: true },
    withdraw: [{ type: Schema.Types.ObjectId, ref: "Withdraw", default: [] }],
    deposit: [{ type: Schema.Types.ObjectId, ref: "Deposit", default: [] }],
    transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction", default: [] }],
    role: { type: String, enum: ["user", "agent", "admin"], default: "user" },
    giftNoticeOpen: { type: Boolean, default: false },
    giftNoticeAmount: { type: Number, default: 0 },
    giftNoticeUpdatedAt: { type: Date, default: null },
    chatLastSeenAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
