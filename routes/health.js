const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * GET /api/health -- public.
 *
 * Returns `{ ok: true, db: 'up' }` when MongoDB answers a ping, and
 * `{ ok: false, db: 'down' }` with a 503 when it does not.
 *
 * This is the endpoint the Docker healthcheck and the deploy compose files
 * probe. It must stay fast and must never require authentication.
 */
router.get('/health', async (_req, res) => {
  try {
    // `admin().ping()` is the cheapest round trip that proves the
    // connection is actually usable.
    await mongoose.connection.db.admin().ping();
    return res.json({ ok: true, db: 'up' });
  } catch (err) {
    return res.status(503).json({ ok: false, db: 'down', err: err.message });
  }
});

module.exports = router;
