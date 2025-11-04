import mongoose from "mongoose";

const DUserSchema = new mongoose.Schema({
  username: String,
  email: String,
  passwordHash: String,
  createdAt: { type: Date, default: Date.now },
});

const DUser = mongoose.model("DUser", DUserSchema);
export default DUser;
