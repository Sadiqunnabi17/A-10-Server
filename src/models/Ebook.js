const mongoose = require("mongoose");

const ebookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String },
    price: { type: Number, required: true },
    genre: { type: String },
    coverImage: { type: String },
    writer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ebook", ebookSchema);