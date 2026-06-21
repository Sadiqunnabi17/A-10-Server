const express = require("express");
const router = express.Router();
const Ebook = require("../models/Ebook");
const Transaction = require("../models/Transaction");
const { verifyToken, verifyWriter, verifyAdmin } = require("../middleware/verifyToken");

// GET ALL PUBLISHED EBOOKS (public)
router.get("/", async (req, res) => {
  try {
    const { search, genre, minPrice, maxPrice, availability, sort } = req.query;

    let query = { isPublished: true };

    // Search by title or writer name
    if (search) {
      const writers = await require("../models/User").find({
        name: { $regex: search, $options: "i" }
      }).select("_id");

      const writerIds = writers.map(w => w._id);
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { writer: { $in: writerIds } },
      ];
    }
      
    // Filter by genre
    if (genre) {
      query.genre = genre;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by availability
    if (availability === "available") {
      query.isSold = false;
    } else if (availability === "sold") {
      query.isSold = true;
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default: newest
    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const total = await Ebook.countDocuments(query);
    const ebooks = await Ebook.find(query)
      .populate("writer", "name photo")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      ebooks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET FEATURED EBOOKS (latest 6)
router.get("/featured", async (req, res) => {
  try {
    const ebooks = await Ebook.find({ isPublished: true })
      .populate("writer", "name photo")
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json(ebooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET TOP WRITERS (3 writers with most sales)
router.get("/top-writers", async (req, res) => {
  try {
    const topWriters = await Transaction.aggregate([
      { $match: { type: "purchase" } },
      { $group: { _id: "$ebook", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: "ebooks",
          localField: "_id",
          foreignField: "_id",
          as: "ebook",
        },
      },
      { $unwind: "$ebook" },
      {
        $group: {
          _id: "$ebook.writer",
          totalSales: { $sum: "$count" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "writer",
        },
      },
      { $unwind: "$writer" },
      {
        $project: {
          _id: 0,
          writer: { _id: 1, name: 1, photo: 1 },
          totalSales: 1,
        },
      },
    ]);

    res.status(200).json(topWriters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE EBOOK (public)
router.get("/:id", async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id).populate(
      "writer",
      "name photo"
    );

    if (!ebook) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    res.status(200).json(ebook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE EBOOK (writer only)
router.post("/", verifyWriter, async (req, res) => {
  try {
    const { title, description, content, price, genre, coverImage } = req.body;

    const ebook = await Ebook.create({
      title,
      description,
      content,
      price,
      genre,
      coverImage,
      writer: req.user.id,
    });

    res.status(201).json(ebook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE EBOOK (writer only)
router.put("/:id", verifyWriter, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    // Only the writer who created it can update
    if (ebook.writer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await Ebook.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE EBOOK (writer or admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    // Writer can only delete their own, admin can delete any
    if (
      ebook.writer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Ebook.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Ebook deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUBLISH / UNPUBLISH EBOOK (writer or admin)
router.patch("/:id/publish", verifyToken, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    if (
      ebook.writer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    ebook.isPublished = !ebook.isPublished;
    await ebook.save();

    res.status(200).json({
      message: `Ebook ${ebook.isPublished ? "published" : "unpublished"} successfully`,
      isPublished: ebook.isPublished,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BOOKMARK EBOOK (user)
router.patch("/:id/bookmark", verifyToken, async (req, res) => {
  try {
    const user = await require("../models/User").findById(req.user.id);
    const ebookId = req.params.id;

    const isBookmarked = user.bookmarks.includes(ebookId);

    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== ebookId
      );
    } else {
      user.bookmarks.push(ebookId);
    }

    await user.save();

    res.status(200).json({
      message: isBookmarked ? "Bookmark removed" : "Bookmark added",
      bookmarks: user.bookmarks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;