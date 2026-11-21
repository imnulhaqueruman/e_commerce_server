/**
 * Route-level contract test.
 *
 * Mounts EVERY file in `routes/` under `/api` (exactly as `server.js` does)
 * and asserts that each endpoint is reachable — i.e. it is not swallowed by
 * another router.
 *
 * This is the regression guard for the bug where `routes/category.js` ended
 * with a path-less `router.use()` catch-all. Because a path-less `use()`
 * layer matches EVERY path, and `category.js` mounted 3rd of 9, it answered
 * with `404 {"err":"Not found"}` for the 30 endpoints registered after it.
 * The unit tests never caught it because they call controllers directly.
 *
 * A 401/403 is a PASS here — it means the route matched and the auth
 * middleware rejected the request. A 404 means the route was shadowed.
 */

// The Stripe controller builds a real SDK instance at require time and the
// refund/intent handlers would otherwise make live network calls. Stub it.
jest.mock('stripe', () =>
  jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(async () => ({ id: 'pi_test', client_secret: 'pi_test_secret' })),
    },
    refunds: {
      create: jest.fn(async () => ({ id: 're_test', status: 'succeeded' })),
    },
  })),
);

const path = require('path');
const fs = require('fs');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const ROOT = path.join(__dirname, '..', '..');
const ROUTES_DIR = path.join(ROOT, 'routes');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.Stripe_Secret = process.env.Stripe_Secret || 'sk_test_ci';

/**
 * Build the same app `server.js` builds: every file in `routes/` mounted
 * under `/api`, plus the app-level JSON 404 that replaced the category
 * router's catch-all.
 */
const buildApp = () => {
  const app = express();
  app.use(express.json());

  fs.readdirSync(ROUTES_DIR)
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => {
      app.use('/api', require(path.join(ROUTES_DIR, file)));
    });

  app.use((_req, res) => res.status(404).json({ err: 'Not found' }));
  return app;
};

/**
 * Every endpoint, with the method and the body it needs.
 * Authenticated endpoints are included — a 401 still proves the route
 * matched.
 *
 * Each row is an object rather than a positional array: `it.each` treats a
 * trailing array element as jest's `done` callback when the test function
 * takes three arguments.
 */
const PUBLIC_ROUTES = [
  { method: 'get', url: '/api/health' },
  { method: 'post', url: '/api/auth/register', body: { email: 'x@y.com', password: 'secret123' } },
  { method: 'post', url: '/api/auth/login', body: { email: 'x@y.com', password: 'secret123' } },
  { method: 'post', url: '/api/auth/logout' },
  { method: 'get', url: '/api/auth/current-user' },
  { method: 'get', url: '/api/products/total' },
  { method: 'get', url: '/api/products/5' },
  { method: 'get', url: '/api/product/some-slug' },
  { method: 'post', url: '/api/products', body: {} },
  { method: 'post', url: '/api/search/filters', body: { query: 'phone' } },
  { method: 'get', url: '/api/product/related/507f1f77bcf86cd799439011' },
  { method: 'get', url: '/api/categories' },
  { method: 'get', url: '/api/category/some-slug' },
  { method: 'get', url: '/api/category/subs/507f1f77bcf86cd799439011' },
  { method: 'get', url: '/api/subs' },
  { method: 'get', url: '/api/sub/some-slug' },
  { method: 'get', url: '/api/coupons' },
  { method: 'get', url: '/api/user/cart' },
  { method: 'post', url: '/api/user/cart', body: { cart: [] } },
  { method: 'delete', url: '/api/user/cart' },
  { method: 'post', url: '/api/user/address', body: { address: '1 Main St' } },
  { method: 'post', url: '/api/user/profile', body: { name: 'A' } },
  { method: 'post', url: '/api/user/order', body: { stripeResponse: { paymentIntent: { id: 'pi_1' } } } },
  { method: 'get', url: '/api/user/orders' },
  { method: 'post', url: '/api/user/cart/coupon', body: { coupon: 'NOPE12' } },
  { method: 'post', url: '/api/user/wishlist', body: { productId: '507f1f77bcf86cd799439011' } },
  { method: 'get', url: '/api/user/wishlist' },
  { method: 'put', url: '/api/user/wishlist/507f1f77bcf86cd799439011' },
  { method: 'post', url: '/api/create-payment-intent', body: { couponApplied: false } },
  { method: 'get', url: '/api/admin/orders' },
  { method: 'get', url: '/api/admin/stats' },
  { method: 'put', url: '/api/admin/order-status', body: { orderId: '507f1f77bcf86cd799439011', orderStatus: 'processing' } },
  { method: 'post', url: '/api/admin/orders/507f1f77bcf86cd799439011/refund' },
  { method: 'post', url: '/api/uploadimages', body: { image: 'data:image/png;base64,AA==' } },
  { method: 'post', url: '/api/removeimages', body: { public_id: 'x' } },
];

describe('route contract — every endpoint is reachable', () => {
  let app;
  let mongo;

  beforeAll(async () => {
    // The controllers hit MongoDB. Without a connection Mongoose buffers
    // the commands and the requests hang forever, so spin up an in-memory
    // server and point Mongoose at it.
    mongo = await MongoMemoryServer.create({ instance: { dbName: 'ecommerce' } });
    await mongoose.connect(mongo.getUri(), {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });

    app = buildApp();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  }, 60000);

  it.each(PUBLIC_ROUTES)(
    '$method $url is not shadowed by another router',
    async ({ method, url, body }) => {
      const res = await request(app)[method](url).send(body || {});

      // A shadowed route answers with the app-level JSON 404 — exactly
      // `{ err: 'Not found' }`. A route that matched may legitimately
      // return 404 for a missing resource, but with its own message, so
      // compare the body rather than the status alone.
      expect(res.body).not.toEqual({ err: 'Not found' });
    },
    20000,
  );

  it('routes are mounted under /api, not the bare root', async () => {
    const res = await request(app).get('/categories');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ err: 'Not found' });
  });

  it('an unknown path returns the JSON 404 shape', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ err: 'Not found' });
  });

  it('no router in routes/ contains a path-less catch-all', () => {
    // The root cause of the shadowing bug: a `router.use()` with no path
    // becomes a layer matching every request. It must never be added back.
    const offenders = [];

    for (const file of fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.js'))) {
      const router = require(path.join(ROUTES_DIR, file));
      for (const layer of router.stack || []) {
        // `layer.route` is set for real routes; middleware layers have it
        // undefined. A path-less `use()` has `layer.path === '/'`.
        if (!layer.route && layer.path === '/' && layer.match !== undefined) {
          offenders.push(`${file}: ${layer.name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
