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
 * NOTE: this router must NOT contain a path-less `router.use()` catch-all.
 * Such a layer matches EVERY path (see `node_modules/express/lib/router/layer.js`
 * fast-slash branch) and, because this file is mounted 3rd of the auto-mount
 * scan, it would swallow every route mounted after it. The JSON 404 / 500
 * handlers live at the app level in `server.js` instead.
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

module.exports = router;
