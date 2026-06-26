const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Ebook = require("../models/Ebook");
const Transaction = require("../models/Transaction");
const { verifyToken } = require("../middleware/verifyToken");

// GET USER PROFILE
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("bookmarks");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE USER PROFILE
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, photo } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, photo },
      { new: true }
    ).select("-password");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET PURCHASE HISTORY
router.get("/purchases", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      buyer: req.user.id,
      type: "purchase",
    })
      .populate({
        path: "ebook",
        select: "title coverImage price writer",
        populate: { path: "writer", select: "name" }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET PURCHASED EBOOKS
router.get("/purchased-ebooks", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      buyer: req.user.id,
      type: "purchase",
    }).populate({
      path: "ebook",
      populate: { path: "writer", select: "name" },
    });

    const ebooks = transactions.map((t) => t.ebook);
    res.status(200).json(ebooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET BOOKMARKS
router.get("/bookmarks", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "bookmarks",
      populate: { path: "writer", select: "name" },
    });

    res.status(200).json(user.bookmarks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET WRITER'S OWN EBOOKS
router.get("/my-ebooks", verifyToken, async (req, res) => {
  try {
    const ebooks = await Ebook.find({ writer: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json(ebooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET WRITER'S SALES HISTORY
router.get("/sales", verifyToken, async (req, res) => {
  try {
    const myEbooks = await Ebook.find({ writer: req.user.id });
    const ebookIds = myEbooks.map((e) => e._id);

    const sales = await Transaction.find({
      ebook: { $in: ebookIds },
      type: "purchase",
    })
      .populate("ebook", "title price coverImage")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE ROLE
router.patch("/role", verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { role },
      { new: true }
    ).select("-password");
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

module.exports = router;