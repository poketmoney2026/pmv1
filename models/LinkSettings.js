// models/LinkSettings.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const LinkSettingsSchema = new Schema(
  {
    contactWhatsApp: { type: String, default: "", trim: true },
    contactTelegram: { type: String, default: "", trim: true },
    contactTelegramGroup: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "link_settings" }
);

export default mongoose.models.LinkSettings || mongoose.model("LinkSettings", LinkSettingsSchema);