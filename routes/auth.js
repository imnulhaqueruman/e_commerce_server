const express = require('express');

const router = express.Router();

// middleWares
const { requireAuth } = require('../middlewares/jwt');

// controller
const {
  currentUser,
  register,
  login,
  logout,
} = require('../controllers/auth');

// JWT-based auth (used by the React frontend)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/current-user', requireAuth, currentUser);

module.exports = router;