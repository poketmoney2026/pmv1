import mongoose from "mongoose";

const { Schema } = mongoose;

const ChatMessageSchema = new Schema(
  {
    threadId: { type: Schema.Types.ObjectId, ref: "ChatThread", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    sessionId: { type: String, default: "" },
  },
  { timestamps: true, collection: "chat_messages" }
);

ChatMessageSchema.index({ threadId: 1, createdAt: 1 });

export default mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema);
