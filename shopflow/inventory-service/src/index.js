const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/', inventoryRoutes);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[inventory-service] Mongo connected');
    app.listen(PORT, () =>
      console.log(`[inventory-service] listening on ${PORT}`),
    );
  } catch (err) {
    console.error('[inventory-service] startup error', err.message);
    process.exit(1);
  }
}

start();