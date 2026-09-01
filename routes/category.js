const express = require('express');

/**
 * Category routes — mounted under `/api` by `server.js`'s readdirSync
 * auto-mount. Categories are addressed by `slug` (auto-generated from
 * `name` via `slugify` server-side — see `models/category.js`).
 *
 *   Reads   (public)   : GET    /categories            list all
 *                        GET    /category/:slug        one + its products
 *                        GET    /category/subs/:_id    sub-categories
 *                                              of a parent category
 *   Writes  (admin)     : POST   /category              create
 *                        PUT    /category/:slug        rename + reslugify
 *                        DELETE /category/:slug        remove
 *
 * Mutating endpoints require a valid JWT (`requireAuth`) AND the
 * authenticated user must have `role === 'admin'` (`requireAdmin`).
 *
 * Two layered handlers at the bottom — a JSON 404 catch-all and a JSON
 * 500 error passthrough — keep category responses JSON-shaped even when
 * no route matches or a downstream handler throws.
 */
const router = express.Router();

const { requireAuth, requireAdmin } = require('../middlewares/jwt');
const {
  create,
  read,
  update,
  remove,
  list,
  getSubs,
} = require('../controllers/category');

// ---- Reads (public) -------------------------------------------------------
// Order matters: literal paths MUST come before `:slug` so they aren't
// swallowed by the param pattern. `/categories` and `/category/subs/:_id`
// are both literals and pre-declare the param segment.
router.get('/categories', list);
router.get('/category/subs/:_id', getSubs);
router.get('/category/:slug', read);

// ---- Writes (admin) -------------------------------------------------------
router.post('/category', requireAuth, requireAdmin, create);
router.put('/category/:slug', requireAuth, requireAdmin, update);
router.delete('/category/:slug', requireAuth, requireAdmin, remove);

// ---- 404 catch-all (JSON) -------------------------------------------------
router.use((req, res) => {
  res.status(404).json({ err: 'Not found' });
});

// ---- Error handler (JSON) -------------------------------------------------
// Any handler that calls `next(err)` lands here. The default Express
// handler returns HTML — we want JSON to match the rest of the API.
router.use((err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[category route error]', err);
  res.status(500).json({ err: 'Category route error' });
});

module.exports = router;
