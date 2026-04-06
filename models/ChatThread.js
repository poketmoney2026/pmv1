import mongoose from "mongoose";

const { Schema } = mongoose;

const ChatThreadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    adminIds: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    unreadByAdmin: { type: Number, default: 0 },
    unreadByUser: { type: Number, default: 0 },
    latestSessionId: { type: String, default: "" },
    latestSessionNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "chat_threads" }
);

export default mongoose.models.ChatThread || mongoose.model("ChatThread", ChatThreadSchema);
