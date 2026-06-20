require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    // Check if admin already exists
    const existing = await User.findOne({ email: "admin@fable.com" });
    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "Fable Admin",
      email: "admin@fable.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin created successfully");
    console.log("Email: admin@fable.com");
    console.log("Password: Admin@123");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();