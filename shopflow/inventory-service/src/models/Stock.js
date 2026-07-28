const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true, unique: true, index: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Stock', StockSchema);