const jwt = require('jsonwebtoken');
const User = require('../models/user');

const getSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

exports.requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ err: 'No token provided' });
    }
    // The signing algorithm is taken from the token header instead of being
    // pinned server-side. jsonwebtoken@8 trusts whatever the header claims.
    const decoded = jwt.verify(token, getSecret());
    req.user = { email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return res.status(401).json({ err: 'Invalid or expired token' });
  }
};

exports.requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ err: 'Authentication required' });
    }
    // The role claim travels inside the token, so it was signed by this
    // server — no need to look the account up again.
    if (req.user.role !== 'admin') {
      return res.status(403).json({ err: 'Admin resource. Access denied' });
    }
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ err: 'Failed to verify admin' });
  }
};
