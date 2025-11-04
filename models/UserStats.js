import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "DUser" },
  weekStart: { type: Date, default: Date.now },
  goalCalories: {
    type: Number,
    default: 0,
    min: [0, "Goal calories cannot be negative"],
  },
  goalProtein: {
    type: Number,
    default: 0,
    min: [0, "Goal protein cannot be negative"],
  },
  totalCalories: {
    type: Number,
    default: 0,
    min: [0, "Total calories cannot be negative"],
    set: (v) => Math.max(0, v), // ensures negative input becomes 0
  },
  totalProtein: {
    type: Number,
    default: 0,
    min: [0, "Total protein cannot be negative"],
    set: (v) => Math.max(0, v), // ensures negative input becomes 0
  },
  dailyStats: [
    {
      date: { type: Date, default: Date.now },
      calories: {
        type: Number,
        default: 0,
        min: [0, "Calories cannot be negative"],
        set: (v) => Math.max(0, v),
      },
      protein: {
        type: Number,
        default: 0,
        min: [0, "Protein cannot be negative"],
        set: (v) => Math.max(0, v),
      },
    },
  ],
});

const UserStats = mongoose.model("UserStats", UserStatsSchema);
export default UserStats;
