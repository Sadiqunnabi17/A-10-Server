// models/Ebook.js
const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  content: String,            // full content, shown only after purchase
  price: { type: Number, required: true },
  genre: String,
  coverImage: String,         // imgBB URL
  writer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Ebook', ebookSchema);