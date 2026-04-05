import mongoose from "mongoose";

const { Schema } = mongoose;

const LeaderboardCycleSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    lastGiveawayAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "leaderboard_cycles" }
);

export default mongoose.models.LeaderboardCycle ||
  mongoose.model("LeaderboardCycle", LeaderboardCycleSchema);
