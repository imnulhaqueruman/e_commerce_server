const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch {
    res.status(400).json({ error: 'Invalid id' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, category } = req.body || {};
    if (!name || price == null || !category) {
      return res
        .status(400)
        .json({ error: 'name, price, and category are required' });
    }
    const product = await Product.create({ name, description, price, category });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch {
    res.status(400).json({ error: 'Invalid id' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Invalid id' });
  }
});

module.exports = router;