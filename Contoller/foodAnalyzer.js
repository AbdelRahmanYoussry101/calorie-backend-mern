// controllers/aiController.js
import fetch from "node-fetch";
import { getNutrition } from "./getCalories.js";
import dotenv from "dotenv";
dotenv.config();


export const analyzeFood = async (req, res) => {
  try {
    // check if image uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    const contentType = req.file.mimetype || "application/octet-stream";
    // send image buffer to Hugging Face
    const response = await fetch(process.env.HUGGING_MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": contentType,
      },
      body: req.file.buffer,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Model error:", result);
      return res.status(500).json({ error: "Model inference failed", details: result });
    }

  let topLabel;
    if (Array.isArray(result) && result.length > 0 && result[0].label) {
      topLabel = result[0]?.label;
    } else if (result.label) {
      topLabel = result.label;
    } else {
      return res.status(400).json({ error: "Could not detect food label" });
    }


    const cleanLabel = topLabel
  .replace(/_/g, " ")     // replace underscores with spaces
  .replace(/\d+/g, "")    // remove any numbers
  .trim();                // remove extra spaces

    console.log(cleanLabel);
    // 4️⃣ Use CalorieNinjas to get nutrition info
    const nutrition = await getNutrition(cleanLabel);


    // ✅ handle case when CalorieNinjas returns nothing
    if (!nutrition || !nutrition.items || nutrition.items.length === 0) {
      return res.status(404).json({
        error: "No nutrition data found for this food. Please try another image.",
      });
    }

    // 5️⃣ Combine both results and send back
    res.json({nutrition
    });

  } catch (err) {
    console.error("❌ Error analyzing food:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};