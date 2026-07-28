const Order = require('../models/order');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const stripe = require('stripe')(process.env.Stripe_Secret);

const ALLOWED_STATUSES = new Set([
  'Not Processed',
  'processing',
  'Dispatched',
  'Cancelled',
  'Completed',
  'Refunded',
]);

exports.orders = async (req, res) => {
  try {
    const all = await Order.find({})
      .sort('-createdAt')
      .populate('products.product', 'title slug price images')
      .lean();
    res.json(all);
  } catch (err) {
    console.error('admin.orders', err);
    res.status(500).json({ err: 'Failed to load orders' });
  }
};

exports.orderStatus = async (req, res) => {
  try {
    const { orderId, orderStatus } = req.body || {};
    if (!orderId || !orderStatus) {
      return res
        .status(400)
        .json({ err: 'orderId and orderStatus are required' });
    }
    if (!ALLOWED_STATUSES.has(orderStatus)) {
      return res
        .status(400)
        .json({ err: `Invalid orderStatus: ${orderStatus}` });
    }
    const updated = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    ).exec();
    if (!updated) return res.status(404).json({ err: 'Order not found' });
    res.json(updated);
  } catch (err) {
    console.error('admin.orderStatus', err);
    res.status(500).json({ err: 'Failed to update order status' });
  }
};

// GET /admin/stats
// Server-side aggregation so the dashboard doesn't have to fan out to
// products + coupons + orders and recompute totals in the browser.
// Query params (all optional):
//   from, to — ISO date strings (e.g. "2026-07-01" or "2026-07-01T00:00:00Z")
//   days     — shortcut window (default 30, capped at 365). Ignored if
//              `from` or `to` is provided.
//   bucket   — "day" (default) | "week" | "month". Controls revenueSeries
//              grouping.
exports.stats = async (req, res) => {
  try {
    const parseDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isFinite(d.getTime()) ? d : null;
    };
    const bucket = ['day', 'week', 'month'].includes(req.query.bucket)
      ? req.query.bucket
      : 'day';
    const bucketFormat =
      bucket === 'week'
        ? '%G-W%V'
        : bucket === 'month'
          ? '%Y-%m'
          : '%Y-%m-%d';

    const fromParam = parseDate(req.query.from);
    const toParam = parseDate(req.query.to);
    const match = {};
    if (fromParam || toParam) {
      match.createdAt = {};
      if (fromParam) match.createdAt.$gte = fromParam;
      if (toParam) match.createdAt.$lte = toParam;
    }
    const usingRange = Boolean(fromParam || toParam);
    const rangeDays = usingRange
      ? Math.max(
          1,
          Math.ceil(
            ((toParam || new Date()).getTime() -
              (fromParam || new Date()).getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const since = new Date(
      Date.now() - rangeDays * 24 * 60 * 60 * 1000,
    );

    const [orderAgg, productCount, couponCount, revenueSeries] =
      await Promise.all([
        Order.aggregate([
          {
            $facet: {
              totals: [
                ...(Object.keys(match).length
                  ? [{ $match: match }]
                  : []),
                {
                  $group: {
                    _id: null,
                    ordersCount: { $sum: 1 },
                    // paymentIntent.amount is stored in cents on Stripe; some
                    // legacy docs may not have it — fall back to per-item
                    // price*count from the embedded products array.
                    piRevenue: {
                      $sum: {
                        $ifNull: ['$paymentIntent.amount', 0],
                      },
                    },
                    itemsRevenue: {
                      $sum: {
                        $reduce: {
                          input: { $ifNull: ['$products', []] },
                          initialValue: 0,
                          in: {
                            $add: [
                              '$$value',
                              {
                                $multiply: [
                                  {
                                    $toDouble: {
                                      $ifNull: ['$$this.price', 0],
                                    },
                                  },
                                  { $ifNull: ['$$this.count', 0] },
                                ],
                              },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              ],
              byStatus: [
                ...(Object.keys(match).length
                  ? [{ $match: match }]
                  : []),
                { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
              ],
            },
          },
        ]),
        Product.estimatedDocumentCount(),
        Coupon.countDocuments({}),
        Order.aggregate([
          ...(Object.keys(match).length
            ? [{ $match: match }]
            : [{ $match: { createdAt: { $gte: since } } }]),
          {
            $group: {
              _id: {
                $dateToString: {
                  format: bucketFormat,
                  date: '$createdAt',
                },
              },
              total: {
                $sum: {
                  $ifNull: ['$paymentIntent.amount', 0],
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const totalsRow = (orderAgg[0] && orderAgg[0].totals[0]) || {
      ordersCount: 0,
      piRevenue: 0,
      itemsRevenue: 0,
    };
    const byStatus = (orderAgg[0] && orderAgg[0].byStatus) || [];

    // Prefer Stripe's cents-based total when present; otherwise fall back
    // to the embedded product math (which is in dollars → convert to cents
    // so the shape matches Stripe).
    const revenueCents =
      totalsRow.piRevenue > 0
        ? totalsRow.piRevenue
        : Math.round(totalsRow.itemsRevenue * 100);

    return res.json({
      ordersCount: totalsRow.ordersCount || 0,
      productCount: productCount || 0,
      couponCount: couponCount || 0,
      revenue: revenueCents / 100,
      byStatus: byStatus.reduce((acc, r) => {
        acc[r._id || 'unknown'] = r.count;
        return acc;
      }, {}),
      revenueSeries: revenueSeries.map((r) => ({
        date: r._id,
        total: (r.total || 0) / 100,
        count: r.count,
      })),
      windowDays: rangeDays,
      range: usingRange
        ? {
            from: (fromParam || new Date(0)).toISOString(),
            to: (toParam || new Date()).toISOString(),
          }
        : null,
      bucket,
    });
  } catch (err) {
    console.error('admin.stats', err);
    res.status(500).json({ err: 'Failed to load admin stats' });
  }
};

// POST /admin/orders/:orderId/refund
// Refunds the PaymentIntent attached to the order and marks it as Refunded.
exports.refundOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ err: 'orderId is required' });
    }

    const order = await Order.findById(orderId).exec();
    if (!order) return res.status(404).json({ err: 'Order not found' });
    if (order.orderStatus === 'Refunded') {
      return res.status(400).json({ err: 'Order already refunded' });
    }

    const paymentIntentId =
      order.paymentIntent && order.paymentIntent.id;
    if (!paymentIntentId) {
      return res
        .status(400)
        .json({ err: 'No paymentIntent recorded for this order' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: 'Refunded' },
      { new: true },
    ).exec();

    return res.json({
      ok: true,
      refundId: refund.id,
      refundStatus: refund.status,
      order: updated,
    });
  } catch (err) {
    console.error('admin.refundOrder', err);
    // Stripe SDK attaches `raw` to its errors — surface the type for clients.
    if (err && err.type === 'StripeInvalidRequestError') {
      return res
        .status(400)
        .json({ err: err.message || 'Stripe rejected the refund' });
    }
    res.status(500).json({ err: 'Failed to refund order' });
  }
};