// models/Interest.js

import mongoose from "mongoose";
const { Schema } = mongoose;
const InterestSchema = new Schema({ valuePercent: { type: Number, default: 0 }, day: { type: Number, default: 0 } }, { timestamps: true, collection: "interest" });
export default mongoose.models.Interest || mongoose.model("Interest", InterestSchema);
