jest.mock('../../models/coupon', () => {
  const { mockModelConstructor, makeQuery } = require('../helpers/controller');
  const Mock = mockModelConstructor();
  Mock.find = jest.fn(() => makeQuery([]));
  Mock.findByIdAndDelete = jest.fn(() => ({
    exec: jest.fn(() => Promise.resolve(null)),
  }));
  return Mock;
});

const Coupon = require('../../models/coupon');
const { mockRes, makeQuery } = require('../helpers/controller');
const coupon = require('../../controllers/coupon');

beforeEach(() => {
  Coupon.mockClear();
  Coupon.mockImplementation(function (doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Coupon.find.mockImplementation(() => makeQuery([]));
  Coupon.findByIdAndDelete.mockImplementation(() => ({
    exec: jest.fn(() => Promise.resolve(null)),
  }));
});

describe('controllers/coupon.js', () => {
  describe('create', () => {
    it('saves coupon from nested body.coupon', async () => {
      const res = mockRes();
      await coupon.create(
        {
          body: {
            coupon: { name: 'SUMMER25', expiry: '2026-12-31', discount: 25 },
          },
        },
        res,
      );

      expect(Coupon).toHaveBeenCalledWith({
        name: 'SUMMER25',
        expiry: '2026-12-31',
        discount: 25,
      });
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 500 when body.coupon is missing', async () => {
      const res = mockRes();
      await coupon.create({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ err: 'Failed to create coupon' });
    });

    it('returns 500 when save fails', async () => {
      Coupon.mockImplementationOnce(function (doc) {
        Object.assign(this, doc);
        this.save = jest.fn().mockRejectedValue(new Error('db'));
      });
      const res = mockRes();
      await coupon.create(
        { body: { coupon: { name: 'X', expiry: '2026-01-01', discount: 10 } } },
        res,
      );
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('remove', () => {
    it('deletes by couponId', async () => {
      const deleted = { _id: 'c1', name: 'OLD' };
      Coupon.findByIdAndDelete.mockImplementation(() => ({
        exec: jest.fn(() => Promise.resolve(deleted)),
      }));
      const res = mockRes();
      await coupon.remove({ params: { couponId: 'c1' } }, res);
      expect(Coupon.findByIdAndDelete).toHaveBeenCalledWith('c1');
      expect(res.json).toHaveBeenCalledWith(deleted);
    });

    it('returns 500 on failure', async () => {
      Coupon.findByIdAndDelete.mockImplementation(() => ({
        exec: jest.fn(() => Promise.reject(new Error('db'))),
      }));
      const res = mockRes();
      await coupon.remove({ params: { couponId: 'c1' } }, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ err: 'Failed to remove coupon' });
    });
  });

  describe('list', () => {
    it('returns coupons newest first', async () => {
      const docs = [{ name: 'A' }];
      Coupon.find.mockImplementation(() => makeQuery(docs));
      const res = mockRes();
      await coupon.list({}, res);
      expect(res.json).toHaveBeenCalledWith(docs);
    });

    it('returns 500 on failure', async () => {
      Coupon.find.mockImplementation(() => ({
        sort: () => ({
          exec: () => Promise.reject(new Error('db')),
        }),
      }));
      const res = mockRes();
      await coupon.list({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ err: 'Failed to list coupons' });
    });
  });
});
