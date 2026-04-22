import mongoose from "mongoose";

const { Schema } = mongoose;

const VisitEventSchema = new Schema(
  {
    sessionKey: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, default: "" },
    mobile: { type: String, default: "", index: true },
    role: { type: String, enum: ["user", "agent", "admin"], default: "user", index: true },
    path: { type: String, default: "/", index: true },
    eventType: { type: String, enum: ["view", "click"], default: "view", index: true },
  },
  { timestamps: true, collection: "visit_events" }
);

VisitEventSchema.index({ role: 1, createdAt: -1 });
VisitEventSchema.index({ userId: 1, createdAt: -1 });
VisitEventSchema.index({ path: 1, createdAt: -1 });
VisitEventSchema.index({ role: 1, path: 1, createdAt: -1 });

export default mongoose.models.VisitEvent || mongoose.model("VisitEvent", VisitEventSchema);
