import mongoose from "mongoose";

const { Schema } = mongoose;

const TutorialSectionSchema = new Schema(
  {
    heading: { type: String, trim: true, default: "" },
    content: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const HelpContentSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    title: { type: String, default: "ব্যবহার নির্দেশিকা", trim: true },
    text: { type: String, default: "", trim: true },
    sections: { type: [TutorialSectionSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "help_content" }
);

export default mongoose.models.HelpContent ||
  mongoose.model("HelpContent", HelpContentSchema);
