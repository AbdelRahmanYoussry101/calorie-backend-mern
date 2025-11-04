dotenv.config();
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import { v2 as cloudinary } from "cloudinary";
import UserStats from "./models/UserStats.js";
import DUser from "./models/DUser.js";
import { registerUser } from "./Contoller/register.js";
import { analyzeFood } from "./Contoller/foodAnalyzer.js";
import {getNutrition} from "./Contoller/getCalories.js"
import { isNewWeek,isNewDay } from "./Contoller/datecheker.js";
import { login } from "./Contoller/login.js";
import {addMealToProfile} from "./Contoller/addFoodProfile.js"
import express from "express";
import mongoose from "mongoose";


const app = express();
app.use(helmet());

const allowedOrigins = [  // dev
  "https://calorie-tracker-v.netlify.app/" // react server
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));


app.use(express.json());

// ✅ configure multer (for handling file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});


// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("DB connection error:", err));

// simple route
app.get("/", function (req, res) {
  res.send("Hello from the backend");
});



function verifyToken(req, res, next) {
  // Header format: "Authorization: Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // split "Bearer token"

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
 
  jwt.verify(token, process.env.JWT_Private_key, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = decodedUser; // decodedUser = { id, email, iat, exp }
    next(); // continue to next route
  });
}

export default verifyToken;


app.post("/reg",registerUser);

app.post("/login",login);


//PROFILE BACKEND

app.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

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
    if (isNewWeek(userStat.weekStart)) {
      userStat.weekStart = new Date();
      userStat.totalCalories = 0;
      userStat.totalProtein = 0;
      userStat.dailyStats = [];
      await userStat.save();
      console.log("🔄 Weekly stats reset!");
    }
    const lastEntry = userStat.dailyStats[userStat.dailyStats.length - 1];
    if (!lastEntry || isNewDay(lastEntry.date)) {
      userStat.dailyStats.push({
        date: new Date(),
        calories: 0,
        protein: 0,
      });
      await userStat.save();
    }
    
    res.json(userStat);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/updateGoals", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalCalories, goalProtein } = req.body;

    // ✅ Use null/undefined check instead of falsy check
    if (goalCalories == null || goalProtein == null) {
      return res.status(400).json({ error: "Missing goal values" });
    }

    // ✅ Update user's stats
    const userStat = await UserStats.findOneAndUpdate(
      { userId },
      { goalCalories, goalProtein },
      { new: true }
    );

    // ✅ If no stats exist, create them automatically
    if (!userStat) {
      const newStat = new UserStats({
        userId,
        goalCalories,
        goalProtein,
        weekStart: new Date().toISOString().split("T")[0],
        totalCalories: 0,
        totalProtein: 0,
        dailyStats: [],
      });
      await newStat.save();
      return res.json(newStat);
    }

    res.json(userStat);
  } catch (err) {
    console.error("Error updating goals:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/analyzeFood",verifyToken,upload.single("image"), analyzeFood);
app.post("/addMeal", verifyToken, addMealToProfile);

app.post("/reset-day",verifyToken,async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toDateString();

  try {
    const user = await UserStats.findOne({ userId });

    // Find today's entry
    const todayEntry = user.dailyStats.find(
      (d) => new Date(d.date).toDateString() === today
    );

    if (!todayEntry) {
      return res.status(404).json({ message: "No entry for today found" });
    }

    // Subtract today's values from totals
    user.totalCalories -= todayEntry.calories;
    user.totalProtein -= todayEntry.protein;

    // Reset today's values
    todayEntry.calories = 0;
    todayEntry.protein = 0;

    await user.save();
    res.json({ message: "Today's stats reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/reset-week", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    
    const user = await UserStats.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const weekStart = new Date(user.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Separate entries that are in this week
    const weekEntries = user.dailyStats.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= weekStart && dayDate < weekEnd;
    });

    // Subtract their totals
    weekEntries.forEach(day => {
      user.totalCalories -= day.calories;
      user.totalProtein -= day.protein;
    });

    // Keep only entries that are *outside* this week
    user.dailyStats = user.dailyStats.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate < weekStart || dayDate >= weekEnd;
    });

    await user.save();
    res.json({ message: "This week's stats reset and removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// analyzeText route (matching structure)
app.post("/analyzeText", verifyToken, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing food name" });
    }

    const nutrition = await getNutrition(query);

    if (!nutrition || !nutrition.items || nutrition.items.length === 0) {
      return res.status(404).json({
        error: "No nutrition data found for this food name.",
      });
    }

    // ✅ Match analyzeFood response
    res.json({ nutrition });
  } catch (err) {
    console.error("Error in /analyzeText:", err.message);
    res.status(500).json({ error: "Failed to analyze text" });
  }
});



app.post("/reset-all", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await UserStats.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Clear the daily stats array
    user.dailyStats = [];
    user.totalCalories = 0;
    user.totalProtein = 0;

    await user.save();
    res.json({ message: "All daily stats removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log("Server running on portt " + PORT);
});
