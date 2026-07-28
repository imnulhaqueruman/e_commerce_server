const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const getSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

const signToken = (user) =>
  jwt.sign({ email: user.email, role: user.role }, getSecret(), {
    expiresIn: '7d',
  });

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

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

exports.logout = async (_req, res) => {
  // Stateless JWT — the client clears the token. Return a small ack.
  return res.json({ ok: true });
};

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

exports.currentUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).exec();
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: 'Failed to fetch user' });
  }
};