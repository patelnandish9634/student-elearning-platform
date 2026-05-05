const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check status
    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // Compare password (plain text for now - should use bcrypt in production)
    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || "lj_university_secret",
      { expiresIn: "1d" }
    );

    // Send response
    res.json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user._id,
      name: user.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;