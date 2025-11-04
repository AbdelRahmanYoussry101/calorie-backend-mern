import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import DUser from "../models/DUser.js";


export const login= async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await DUser.findOne({ email:email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_Private_key, { expiresIn: "1d" });

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}