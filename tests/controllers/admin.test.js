process.env.Stripe_Secret = 'sk_test_fake';

const mockRefundsCreate = jest.fn();

jest.mock('stripe', () =>
  jest.fn(() => ({
    refunds: { create: mockRefundsCreate },
  })),
);

jest.mock('../../models/order', () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../models/product', () => ({
  estimatedDocumentCount: jest.fn(),
}));

jest.mock('../../models/coupon', () => ({
  countDocuments: jest.fn(),
}));

const Order = require('../../models/order');
const Product = require('../../models/product');
const Coupon = require('../../models/coupon');
const { mockRes, makeExec } = require('../helpers/controller');
const admin = require('../../controllers/admin');

beforeEach(() => {
  mockRefundsCreate.mockReset();
  Order.find.mockReset();
  Order.findByIdAndUpdate.mockReset();
  Order.findById.mockReset();
  Order.aggregate.mockReset();
  Product.estimatedDocumentCount.mockReset();
  Coupon.countDocuments.mockReset();
});

describe('controllers/admin.js', () => {
  describe('orders', () => {
    it('returns populated orders newest first', async () => {
      const docs = [{ _id: 'o1' }];
      const chain = {
        sort: jest.fn(function () {
          return this;
        }),
        populate: jest.fn(function () {
          return this;
        }),
        lean: jest.fn(() => Promise.resolve(docs)),
      };
      Order.find.mockReturnValue(chain);

      const res = mockRes();
      await admin.orders({}, res);

      expect(Order.find).toHaveBeenCalledWith({});
      expect(chain.sort).toHaveBeenCalledWith('-createdAt');
      expect(res.json).toHaveBeenCalledWith(docs);
    });

    it('returns 500 on failure', async () => {
      Order.find.mockReturnValue({
        sort: () => ({
          populate: () => ({
            lean: () => Promise.reject(new Error('db')),
          }),
        }),
      });
      const res = mockRes();
      await admin.orders({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('orderStatus', () => {
    it('rejects missing fields', async () => {
      const res = mockRes();
      await admin.orderStatus({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid status', async () => {
      const res = mockRes();
      await admin.orderStatus(
        { body: { orderId: 'o1', orderStatus: 'Nope' } },
        res,
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].err).toMatch(/Invalid orderStatus/);
    });

    it('updates and returns the order', async () => {
      const updated = { _id: 'o1', orderStatus: 'Completed' };
      Order.findByIdAndUpdate.mockReturnValue(makeExec(updated));

      const res = mockRes();
      await admin.orderStatus(
        { body: { orderId: 'o1', orderStatus: 'Completed' } },
        res,
      );

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('returns 404 when order missing', async () => {
      Order.findByIdAndUpdate.mockReturnValue(makeExec(null));
      const res = mockRes();
      await admin.orderStatus(
        { body: { orderId: 'missing', orderStatus: 'Cancelled' } },
        res,
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('stats', () => {
    it('aggregates dashboard stats', async () => {
      Order.aggregate
        .mockResolvedValueOnce([
          {
            totals: [
              { ordersCount: 2, piRevenue: 5000, itemsRevenue: 0 },
            ],
            byStatus: [{ _id: 'Completed', count: 2 }],
          },
        ])
        .mockResolvedValueOnce([
          { _id: '2026-07-01', total: 5000, count: 2 },
        ]);
      Product.estimatedDocumentCount.mockResolvedValue(10);
      Coupon.countDocuments.mockResolvedValue(3);

      const res = mockRes();
      await admin.stats({ query: {} }, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.ordersCount).toBe(2);
      expect(payload.productCount).toBe(10);
      expect(payload.couponCount).toBe(3);
      expect(payload.revenue).toBe(50);
      expect(payload.byStatus).toEqual({ Completed: 2 });
      expect(payload.bucket).toBe('day');
    });

    it('returns 500 on aggregation failure', async () => {
      Order.aggregate.mockRejectedValue(new Error('db'));
      const res = mockRes();
      await admin.stats({ query: {} }, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('refundOrder', () => {
    it('rejects missing orderId', async () => {
      const res = mockRes();
      await admin.refundOrder({ params: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when order not found', async () => {
      Order.findById.mockReturnValue(makeExec(null));
      const res = mockRes();
      await admin.refundOrder({ params: { orderId: 'x' } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('rejects already-refunded orders', async () => {
      Order.findById.mockReturnValue(
        makeExec({ orderStatus: 'Refunded', paymentIntent: { id: 'pi_1' } }),
      );
      const res = mockRes();
      await admin.refundOrder({ params: { orderId: 'o1' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ err: 'Order already refunded' });
    });

    it('rejects orders without paymentIntent', async () => {
      Order.findById.mockReturnValue(
        makeExec({ orderStatus: 'Completed', paymentIntent: null }),
      );
      const res = mockRes();
      await admin.refundOrder({ params: { orderId: 'o1' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates a Stripe refund and marks order Refunded', async () => {
      Order.findById.mockReturnValue(
        makeExec({
          orderStatus: 'Completed',
          paymentIntent: { id: 'pi_abc' },
        }),
      );
      mockRefundsCreate.mockResolvedValue({ id: 're_1', status: 'succeeded' });
      const updated = { _id: 'o1', orderStatus: 'Refunded' };
      Order.findByIdAndUpdate.mockReturnValue(makeExec(updated));

      const res = mockRes();
      await admin.refundOrder({ params: { orderId: 'o1' } }, res);

      expect(mockRefundsCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_abc',
      });
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        refundId: 're_1',
        refundStatus: 'succeeded',
        order: updated,
      });
    });

    it('surfaces StripeInvalidRequestError as 400', async () => {
      Order.findById.mockReturnValue(
        makeExec({
          orderStatus: 'Completed',
          paymentIntent: { id: 'pi_bad' },
        }),
      );
      const err = new Error('already refunded');
      err.type = 'StripeInvalidRequestError';
      mockRefundsCreate.mockRejectedValue(err);

      const res = mockRes();
      await admin.refundOrder({ params: { orderId: 'o1' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
