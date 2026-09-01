/**
 * Authentication controller.
 *
 * Two parallel flows share this file:
 *  - JWT (used by the React client): register / login / logout / currentUser
 *    issue `Authorization: Bearer <token>` headers verified by
 *    `middlewares/jwt.js#requireAuth`.
 *  - Legacy Firebase: `createOrUpdateUser` is still mounted on
 *    `POST /api/create-or-update-user` for backwards compat; it expects
 *    `req.user` to already be populated by `middlewares/auth#authCheck`.
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
// client. The User model also declares `select: false` on `password`,
// so this is belt-and-suspenders for the path where `password` was
// explicitly selected (none today, but worth keeping).
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
    const hash = await bcrypt.hash(password, 10);
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
    const user = await User.findOne({ email }).exec();
    if (!user || !user.password) {
      return res.status(401).json({ err: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
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
 * LEGACY — Firebase-only path. Mounted on
 * POST /api/create-or-update-user behind `authCheck` (see routes/auth.js).
 * `req.user` is already populated by the Firebase middleware before we get
 * here. Behaves as an upsert keyed on `email` and ignores passwords
 * because Firebase owns them.
 *
 * Remove this endpoint (and the authCheck/adminCheck wiring in
 * `routes/auth.js`) once no callers remain — see CLAUDE.md.
 */
exports.createOrUpdateUser = async (req, res) => {
  const { name, email, picture } = req.user;
  const user = await User.findOneAndUpdate(
    { email },
    { name: email.split('@')[0], picture },
    { new: true }
  );
  if (user) {
    console.log('User Updated', user);
    return res.json(user);
  }
  const newUser = await new User({
    email,
    name: email.split('@')[0],
    picture,
  }).save();
  console.log('User Created', newUser);
  return res.json(newUser);
};

/**
 * GET /api/auth/current-user (JWT) and POST /api/current-user (Firebase).
 * Returns the User doc keyed by `req.user.email` set by the upstream
 * middleware. The Firebase variant returns the full doc including the
 * firebase-derived fields; the JWT variant does the same minus password.
 */
exports.currentUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).exec();
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: 'Failed to fetch user' });
  }
};