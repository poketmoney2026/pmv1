import mongoose from "mongoose";

const { Schema } = mongoose;

const NoticeSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    title: { type: String, default: "NOTICE" },
    body: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "notices" }
);

export default mongoose.models.Notice || mongoose.model("Notice", NoticeSchema);
