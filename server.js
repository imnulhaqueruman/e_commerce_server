/**
 * API entrypoint.
 *
 * Boot order matters and is deliberate:
 *   1. Load `.env`.
 *   2. Connect to MongoDB.
 *   3. ONLY THEN start listening.
 *
 * Step 3 is a hard guarantee, not an optimisation: `CLAUDE.md` promises the
 * server "only starts listening after MongoDB connects, so DB-touching routes
 * won't 404 during boot". A client that hits a route while the connection is
 * still buffering would otherwise get a confusing Mongoose timeout instead of
 * a clean connection refusal.
 *
 * Route mounting is a filesystem scan — every file in `routes/` is mounted
 * under `/api`. Consequences:
 *   - Adding a new API surface means dropping a file into `routes/`.
 *   - Mount order is `fs.readdirSync` order (alphabetical on most platforms):
 *     admin, auth, category, cloudinary, coupon, health, product, stripe,
 *     sub, user.
 *   - A router MUST NOT contain a path-less `router.use()` catch-all. Such a
 *     layer matches EVERY path (see `node_modules/express/lib/router/layer.js`
 *     fast-slash branch) and would swallow every route mounted after it. The
 *     JSON 404/500 handlers live here at the app level instead — see the
 *     bottom of this file.
 */
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_NAME = process.env.DB_NAME || 'ecommerce';

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

/**
 * Resolve the Mongo connection string.
 * `MONGO_URI` wins; otherwise fall back to a local mongod on the default port.
 */
const resolveMongoUri = () =>
  process.env.MONGO_URI || `mongodb://localhost:27017/${DB_NAME}`;

/**
 * Connect to MongoDB.
 *
 * When `USE_MEMORY_MONGO=1` and the primary connection fails, fall back to an
 * in-process `mongodb-memory-server` instead of crashing. That keeps `npm run
 * dev` usable on a machine with no Docker and no local mongod — see
 * `scripts/mem-mongo.js`.
 *
 * @param {string} uri
 * @returns {Promise<string>} the URI actually connected to
 */
const connectToDatabase = async (uri) => {
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  return uri;
};

/**
 * Boot the in-process Mongo fallback and connect to it.
 * @returns {Promise<string>}
 */
const connectToMemoryMongo = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mem = await MongoMemoryServer.create({ instance: { dbName: DB_NAME } });
  const memUri = mem.getUri();

  // Hold the memory server open for the lifetime of the process.
  const stop = async () => {
    await mem.stop();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  await connectToDatabase(memUri);
  return memUri;
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(morgan('dev'));
// Cloudinary image uploads arrive as base64 data URLs, so the JSON body limit
// needs headroom over the express default of 100kb.
app.use(bodyParser.json({ limit: '2mb' }));
app.use(cors());

// A small banner for the root path — the Docker healthcheck hits `/`, and a
// JSON body is easier to eyeball than an empty 404.
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'e-commerce-api' });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const ROUTES_DIR = path.join(__dirname, 'routes');

/**
 * Make an async controller's rejection reach the Express error handler.
 *
 * Express 4 does NOT catch rejected promises: if an async handler throws,
 * the rejection is unhandled and the process dies. Every controller in this
 * codebase is `async`, so a single unhandled DB error would take the whole
 * API down.
 *
 * Rather than hand-wrap every controller, patch each route's handlers once
 * at mount time: a returned promise gets a `.catch(next)` attached, so the
 * rejection flows into the app-level JSON 500 handler.
 *
 * @param {import('express').Router} router
 * @returns {import('express').Router} the same router
 */
const catchAsyncRejections = (router) => {
  for (const layer of router.stack || []) {
    if (!layer.route) continue;

    for (const handler of layer.route.stack) {
      // 4-arg handlers are Express error middleware — leave them alone.
      if (handler.handle.length >= 4) continue;

      const original = handler.handle;
      handler.handle = function wrapped(req, res, next) {
        try {
          const result = original.call(this, req, res, next);
          if (result && typeof result.then === 'function') {
            result.catch(next);
          }
        } catch (err) {
          next(err);
        }
      };
    }
  }
  return router;
};

fs.readdirSync(ROUTES_DIR)
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const router = require(path.join(ROUTES_DIR, file));
    app.use('/api', catchAsyncRejections(router));
  });

// ---------------------------------------------------------------------------
// Fallbacks — mounted AFTER every router so they only fire when nothing matched
// ---------------------------------------------------------------------------

// JSON 404. Express's default handler returns HTML; the API contract is JSON.
app.use((_req, res) => {
  res.status(404).json({ err: 'Not found' });
});

// JSON 500. The 4-arg signature is what tells Express this is an error
// handler rather than ordinary middleware.
app.use((err, _req, res, _next) => {
  console.error('[api error]', err);
  res.status(500).json({ err: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const start = async () => {
  const uri = resolveMongoUri();

  try {
    await connectToDatabase(uri);
    console.log(`DB CONNECTED (${uri})`);
  } catch (err) {
    if (process.env.USE_MEMORY_MONGO === '1') {
      console.warn(`Primary Mongo connection failed (${err.message}) — falling back to in-memory MongoDB`);
      await connectToMemoryMongo();
      console.log('DB CONNECTED (in-memory)');
    } else {
      console.error(`DB CONNECTION ERROR: ${err.message}`);
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`API listening at http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
