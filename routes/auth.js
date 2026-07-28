const express = require('express');

const router = express.Router();

// middleWares
const { authCheck, adminCheck } = require('../middlewares/auth');
const { requireAuth } = require('../middlewares/jwt');

// controller
const {
  createOrUpdateUser,
  currentUser,
  register,
  login,
  logout,
} = require('../controllers/auth');

// New JWT-based auth (used by the React frontend)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/current-user', requireAuth, currentUser);

// Legacy Firebase endpoints — kept for backwards compatibility.
router.post('/create-or-update-user', authCheck, createOrUpdateUser);
router.post('/current-user', authCheck, currentUser);
router.post('/current-admin', authCheck, adminCheck, currentUser);

module.exports = router;