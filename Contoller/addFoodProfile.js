import UserStats from "../models/UserStats.js";
import { isNewDay } from "./datecheker.js";

export const addMealToProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { calories, protein, name } = req.body; // fat/carbs optional

    // Find user stats or create if not exists
    let userStat = await UserStats.findOne({ userId });
    if (!userStat) {
      userStat = await UserStats.create({
        userId,
        goalCalories: 2000,
        goalProtein: 150,
        totalCalories: 0,
        totalProtein: 0,
        dailyStats: [],
      });
    }

    const stats = userStat;

    // Check if a new day
    const lastDaily = stats.dailyStats[stats.dailyStats.length - 1];
    if (!lastDaily || isNewDay(lastDaily.date)) {
      stats.dailyStats.push({ date: new Date(), calories: 0, protein: 0 });
    }

    // Add values to today's stats
    const today = stats.dailyStats[stats.dailyStats.length - 1];
    today.calories += calories;
    today.protein += protein;

    // Update totals
    stats.totalCalories += calories;
    stats.totalProtein += protein;

    await stats.save();

    res.json({ message: `${name} added to today's stats`, stats });
  } catch (err) {
    console.error("Add meal error:", err);
    res.status(500).json({ error: "Failed to add meal" });
  }
};
