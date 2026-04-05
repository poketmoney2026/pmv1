import mongoose from "mongoose";

const PaymentMethodSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["bkash", "nagad"],
      required: true,
      unique: true,
      index: true,
    },
    number: { type: String, default: "" }, // 01XXXXXXXXX (blank allowed)
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentMethod ||
  mongoose.model("PaymentMethod", PaymentMethodSchema);
