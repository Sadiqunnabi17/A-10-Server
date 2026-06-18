// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['purchase', 'publishing_fee'] },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ebook: { type: mongoose.Schema.Types.ObjectId, ref: 'Ebook' },
  amount: Number,
  stripeSessionId: String,
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);