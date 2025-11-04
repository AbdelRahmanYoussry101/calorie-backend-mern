import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
const CALORIE_NINJA_URL = "https://api.calorieninjas.com/v1/nutrition";
const CALORIE_NINJA_KEY = process.env.CALORIE_NINJA_KEY; // store safely in .env

export async function getNutrition(query) {
  try {
    const response = await fetch(`${CALORIE_NINJA_URL}?query=${encodeURIComponent(query)}`, {
      headers: { "X-Api-Key": CALORIE_NINJA_KEY },
    });

    if (!response.ok) {
      throw new Error(`API nutrition error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("❌ Nutrition API Error:", err.message);
    throw err;
  }
}

