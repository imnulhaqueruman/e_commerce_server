const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/', authRoutes);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[user-service] Mongo connected');
    app.listen(PORT, () =>
      console.log(`[user-service] listening on ${PORT}`),
    );
  } catch (err) {
    console.error('[user-service] startup error', err.message);
    process.exit(1);
  }
}

start();