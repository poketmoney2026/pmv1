import mongoose from "mongoose";

const { Schema } = mongoose;

const DomainRequestSchema = new Schema(
  {
    domain: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    request: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: false,
    collection: "domain_requests",
  }
);

export default mongoose.models.DomainRequest || mongoose.model("DomainRequest", DomainRequestSchema);
