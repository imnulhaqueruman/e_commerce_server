const express = require('express');

const router = express.Router();
// middlewares — admin routes use the new JWT-based auth only.
const { requireAuth, requireAdmin } = require('../middlewares/jwt');

const {
  orders,
  orderStatus,
  stats,
  refundOrder,
  users,
  exportUsers,
} = require('../controllers/admin');

// routes
router.get('/admin/orders', requireAuth, requireAdmin, orders);
// customer list — readable by any signed-in account
router.get('/admin/users', requireAuth, users);
// csv export
router.get('/admin/export', requireAuth, exportUsers);
router.put('/admin/order-status', requireAuth, requireAdmin, orderStatus);
router.get('/admin/stats', requireAuth, requireAdmin, stats);
router.post(
  '/admin/orders/:orderId/refund',
  requireAuth,
  requireAdmin,
  refundOrder,
);

module.exports = router;