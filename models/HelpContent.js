import mongoose from "mongoose";

const { Schema } = mongoose;

const HelpContentSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    title: { type: String, default: "ব্যবহার নির্দেশিকা", trim: true },
    text: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "help_content" }
);

export default mongoose.models.HelpContent ||
  mongoose.model("HelpContent", HelpContentSchema);
