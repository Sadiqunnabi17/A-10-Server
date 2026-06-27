const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Ebook = require("../models/Ebook");
const Transaction = require("../models/Transaction");
const { verifyAdmin } = require("../middleware/verifyToken");

// GET ALL USERS
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CHANGE USER ROLE
router.patch("/users/:id/role", verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE USER
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL EBOOKS (admin)
router.get("/ebooks", verifyAdmin, async (req, res) => {
  try {
    const ebooks = await Ebook.find()
      .populate("writer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(ebooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE ANY EBOOK (admin)
router.delete("/ebooks/:id", verifyAdmin, async (req, res) => {
  try {
    await Ebook.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Ebook deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL TRANSACTIONS
router.get("/transactions", verifyAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("buyer", "name email")
      .populate({
        path: "ebook",
        select: "title price writer",
        populate: { path: "writer", select: "name" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ANALYTICS
router.get("/analytics", verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalWriters = await User.countDocuments({ role: "writer" });
    const totalEbooks = await Ebook.countDocuments();

    const revenueData = await Transaction.aggregate([
      { $match: { type: "purchase" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Monthly sales
    const monthlySales = await Transaction.aggregate([
      { $match: { type: "purchase" } },
      {
        $group: {
          _id: { 
            month: {$month: "$createdAt" },
            year: {$year: "$createdAt" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Ebooks by genre
    const ebooksByGenre = await Ebook.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      totalUsers,
      totalWriters,
      totalEbooks,
      totalRevenue,
      monthlySales,
      ebooksByGenre,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;