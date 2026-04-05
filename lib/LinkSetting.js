import mongoose from "mongoose";

const { Schema } = mongoose;

const LinkSettingSchema = new Schema(
  {
    deposit: { type: String, default: "/user/deposit" },
    withdraw: { type: String, default: "/user/withdraw" },
    profile: { type: String, default: "/user/profile" },
    support: { type: String, default: "/user/contact" },
    transactions: { type: String, default: "/user/transactions" },
  },
  { timestamps: true, collection: "link_settings" }
);

LinkSettingSchema.index({ createdAt: -1 });

export default mongoose.models.LinkSetting ||
  mongoose.model("LinkSetting", LinkSettingSchema);
