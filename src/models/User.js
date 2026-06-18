// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,           // null for Google users
  role: { type: String, enum: ['user', 'writer', 'admin'], default: 'user' },
  photo: String,
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ebook' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);