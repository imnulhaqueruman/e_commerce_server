const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/', productRoutes);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[product-service] Mongo connected');
    app.listen(PORT, () =>
      console.log(`[product-service] listening on ${PORT}`),
    );
  } catch (err) {
    console.error('[product-service] startup error', err.message);
    process.exit(1);
  }
}

start();