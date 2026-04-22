import mongoose from "mongoose";

const { Schema } = mongoose;

const GeneralSettingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    minDeposit: { type: Number, default: null, min: 0 },
    maxDeposit: { type: Number, default: null, min: 0 },
    depositTimerHours: { type: Number, default: 1, min: 0 },
    allowMultipleDeposits: { type: Boolean, default: true },
    agentMinDepositBkash: { type: Number, default: null, min: 0 },
    agentMinDepositNagad: { type: Number, default: null, min: 0 },
    agentCommissionPercent: { type: Number, default: 0, min: 0 },
    minWithdraw: { type: Number, default: null, min: 0 },
    maxWithdraw: { type: Number, default: null, min: 0 },
    withdrawTimerHours: { type: Number, default: 1, min: 0 },
    rechargeMinWithdraw: { type: Number, default: 20, min: 0 },
    rechargeMaxWithdraw: { type: Number, default: null, min: 0 },
    withdrawFee: { type: Number, default: null, min: 0 },
    dailyWithdrawLimit: { type: Number, default: null, min: 0 },
    dailyAmountLimit: { type: Number, default: null, min: 0 },
    claimCooldownSec: { type: Number, default: 120, min: 1 },
    noticeIntervalMin: { type: Number, default: 30, min: 1 },
    firstReferralBonus: { type: Number, default: 10, min: 0 },
    regularReferralBonus: { type: Number, default: 0, min: 0 },
    welcomeBonus: { type: Number, default: 5, min: 0 },
    giftBoxAmount: { type: Number, default: 5, min: 0 },
    firstPrize: { type: Number, default: 10000, min: 0 },
    secondPrize: { type: Number, default: 5000, min: 0 },
    thirdPrize: { type: Number, default: 3000, min: 0 },
    rank4to10Prize: { type: Number, default: 2000, min: 0 },
    rank11to50Prize: { type: Number, default: 1000, min: 0 },
  },
  { timestamps: true, collection: "general_settings" }
);

export default mongoose.models.GeneralSettings ||
  mongoose.model("GeneralSettings", GeneralSettingsSchema);
