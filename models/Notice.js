import mongoose from "mongoose";

const { Schema } = mongoose;

const NoticeSchema = new Schema(
  {
    key: { type: String, default: "", index: true },
    title: { type: String, default: "NOTICE" },
    body: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    type: { type: String, enum: ["modal", "news"], default: "modal" },
    intervalMin: { type: Number, default: 30, min: 1 },
    maxShows: { type: Number, default: 0, min: 0 },
    targetMobile: { type: String, default: "", index: true },
  },
  { timestamps: true, collection: "notices" }
);

NoticeSchema.index({ isActive: 1, updatedAt: -1 });
NoticeSchema.index({ targetMobile: 1, isActive: 1, updatedAt: -1 });

export default mongoose.models.Notice || mongoose.model("Notice", NoticeSchema);
