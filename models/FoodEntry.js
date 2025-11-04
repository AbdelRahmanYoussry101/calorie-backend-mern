import mongoose from "mongoose";

const FoodEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "DUser" },
  imageUrl: String,
  foodName: String,
  calories: Number,
  protein: Number,
  date: { type: Date, default: Date.now },
});

const FoodEntry = mongoose.model("FoodEntry", FoodEntrySchema);
export default FoodEntry;
