import bcrypt from "bcrypt";
import DUser from "../models/DUser.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await DUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    await DUser.create({
      username,
      email,
      passwordHash: hash,
    });

    // ✅ Return 201 Created with no body
    res.sendStatus(201);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
