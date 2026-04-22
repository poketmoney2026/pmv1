import mongoose from "mongoose";

const { Schema } = mongoose;

const VisitSessionSchema = new Schema(
  {
    sessionKey: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, default: "" },
    mobile: { type: String, default: "", index: true },
    role: { type: String, enum: ["user", "agent", "admin"], default: "user", index: true },
    currentPath: { type: String, default: "/" },
    firstSeenAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    userAgent: { type: String, default: "" },
    pingCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "visit_sessions" }
);

VisitSessionSchema.index({ role: 1, lastSeenAt: -1 });
VisitSessionSchema.index({ userId: 1, lastSeenAt: -1 });

export default mongoose.models.VisitSession || mongoose.model("VisitSession", VisitSessionSchema);
