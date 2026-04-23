import mongoose from "mongoose";
const { Schema } = mongoose;

const TutorialVideoSchema = new Schema(
  {
    audience: { type: String, enum: ["user", "agent"], default: "user", index: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "tutorial_videos" }
);

export default mongoose.models.TutorialVideo || mongoose.model("TutorialVideo", TutorialVideoSchema);
