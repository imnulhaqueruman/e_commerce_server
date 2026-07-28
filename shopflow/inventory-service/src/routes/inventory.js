const express = require('express');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  const stocks = await Stock.find();
  res.json(stocks);
});

router.get('/:product_id', async (req, res) => {
  const stock = await Stock.findOne({ product_id: req.params.product_id });
  if (!stock) return res.json({ product_id: req.params.product_id, quantity: 0 });
  res.json(stock);
});

router.post('/', auth, async (req, res) => {
  try {
    const { product_id, quantity } = req.body || {};
    if (!product_id || quantity == null) {
      return res
        .status(400)
        .json({ error: 'product_id and quantity are required' });
    }
    const stock = await Stock.findOneAndUpdate(
      { product_id },
      { $set: { quantity } },
      { new: true, upsert: true, runValidators: true },
    );
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:product_id', auth, async (req, res) => {
  try {
    const { quantity } = req.body || {};
    if (quantity == null) {
      return res.status(400).json({ error: 'quantity is required' });
    }
    const stock = await Stock.findOneAndUpdate(
      { product_id: req.params.product_id },
      { $set: { quantity } },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;