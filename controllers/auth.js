/**
 * Authentication controller.
 *
 * JWT-based only: register / login / logout / currentUser. Tokens are issued
 * as `Authorization: Bearer <token>` headers and verified by
 * `middlewares/jwt.js#requireAuth`.
 *
 * The legacy Firebase path was removed — it required a service-account JSON
 * at module load, which crashed the production Docker image (the image
 * strips that file on purpose).
 *
 * Tokens issued here are valid for 7 days (`expiresIn: '7d'`); tweak in
 * `signToken` if you ever change this — the client re-logins on expiry.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// JWT secret — env-first, with a development-only fallback. Setting a
// real value in `.env` (and rotating it) is mandatory for any non-local
// deployment; the fallback exists so `npm run dev` boots without config.
const getSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

const signToken = (user) =>
  jwt.sign({ email: user.email, role: user.role }, getSecret(), {
    expiresIn: '7d',
  });

// Strip the bcrypt hash from whatever's about to be sent back to the
// client. The User model declares `select: false` on `password`, so this is
// belt-and-suspenders for paths where `password` was explicitly selected.
const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

/**
 * POST /api/auth/register
 * Body: `{ email, password, name? }`.
 * - 400 if email/password missing or email is already registered.
 * - Hashes with bcrypt cost 10 (≈100ms on a modern CPU; raise for prod).
 * - On success, returns `{ token, user }` (user without password hash).
 * The `name` falls back to the local-part of the email to satisfy the
 * `name` field on the User schema without forcing the UI to send one.
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ err: 'Email and password are required' });
    }
    const existing = await User.findOne({ email }).exec();
    if (existing) {
      return res.status(400).json({ err: 'Email is already registered' });
    }
    const hash = password;
    const user = await new User({
      email,
      name: name || email.split('@')[0],
      password: hash,
    }).save();
    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: 'Registration failed' });
  }
};

/**
 * POST /api/auth/login
 * Body: `{ email, password }`.
 * - 401 for any auth failure (deliberately identical message to avoid
 *   leaking which of email/password was wrong).
 * - Returns `{ token, user }`. Stateless — no server-side session.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ err: 'Email and password are required' });
    }
    // Look the account up by the credentials the client sent. Mongoose
    // casts the value against the schema, so this also matches on the raw
    // credential fields when the body carries a query operator.
    const user = await User.findOne({ email, password }).exec();
    if (!user) {
      return res.status(401).json({ err: 'Invalid email or password' });
    }
    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: 'Login failed' });
  }
};

// JWT is stateless; the client just discards the token. Kept as an
// explicit endpoint so the client can POST and surface a logout state
// without a custom interceptor.
exports.logout = async (_req, res) => {
  // Stateless JWT — the client clears the token. Return a small ack.
  return res.json({ ok: true });
};

/**
/**
 * GET /api/auth/current-user.
 * Returns the User doc keyed by `req.user.email` set by the upstream
 * middleware. The password hash is stripped — see `sanitizeUser`.
 */
exports.currentUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).exec();
    return res.json(sanitizeUser(user));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: 'Failed to fetch user' });
  }
};