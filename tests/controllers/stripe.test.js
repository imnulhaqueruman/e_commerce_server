/**
 * Direct unit tests for controllers/stripe.js — no Express, no routing.
 *
 * The regression this file exists for: the `createPaymentIntent` catch
 * block used to log the error and return WITHOUT responding, so a failed
 * Stripe call left the HTTP request open until the client timed out. The
 * test asserts the handler always answers.
 */
process.env.JWT_SECRET = 'controller-test-secret';
process.env.NODE_ENV = 'test';
process.env.Stripe_Secret = 'sk_test_ci';

// Stub the Stripe SDK — the real one would make network calls.
jest.mock('stripe', () =>
  jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(async () => ({
        id: 'pi_test',
        client_secret: 'pi_test_secret',
      })),
    },
  })),
);

jest.mock('../../models/user', () => {
  const { mockModelConstructor, makeQuery } = require('../helpers/controller');
  const Mock = mockModelConstructor();
  Mock.findOne = jest.fn(() => makeQuery(null));
  return Mock;
});

jest.mock('../../models/cart', () => {
  const { mockModelConstructor, makeQuery } = require('../helpers/controller');
  const Mock = mockModelConstructor();
  Mock.findOne = jest.fn(() => makeQuery(null));
  return Mock;
});

jest.mock('../../models/product', () => {
  const { mockModelConstructor } = require('../helpers/controller');
  return mockModelConstructor();
});

jest.mock('../../models/coupon', () => {
  const { mockModelConstructor } = require('../helpers/controller');
  return mockModelConstructor();
});

const stripeFactory = require('stripe');
const User = require('../../models/user');
const Cart = require('../../models/cart');
const stripeController = require('../../controllers/stripe');
const { mockRes, makeQuery } = require('../helpers/controller');

/** The mocked SDK instance created by `require('stripe')(secret)`. */
const stripeInstance = stripeFactory.mock.results[0].value;

beforeEach(() => {
  User.findOne.mockImplementation(() =>
    makeQuery({ _id: 'u1', email: 'a@b.com' }),
  );
  Cart.findOne.mockImplementation(() =>
    makeQuery({ cartTotal: 120, totalAfterDiscount: 90 }),
  );
  stripeInstance.paymentIntents.create.mockImplementation(async () => ({
    id: 'pi_test',
    client_secret: 'pi_test_secret',
  }));
});

describe('controllers/stripe.js', () => {
  describe('createPaymentIntent', () => {
    it('charges the discounted total when a coupon was applied', async () => {
      const res = mockRes();
      await stripeController.createPaymentIntent(
        { body: { couponApplied: true }, user: { email: 'a@b.com' } },
        res,
      );

      expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith({
        amount: 9000,
        currency: 'usd',
      });
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ payable: 9000, cartTotal: 120 }),
      );
    });

    it('charges the cart total when no coupon was applied', async () => {
      const res = mockRes();
      await stripeController.createPaymentIntent(
        { body: { couponApplied: false }, user: { email: 'a@b.com' } },
        res,
      );

      expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith({
        amount: 12000,
        currency: 'usd',
      });
    });

    it('responds 500 when Stripe throws instead of hanging', async () => {
      stripeInstance.paymentIntents.create.mockRejectedValueOnce(
        new Error('invalid api key'),
      );

      const res = mockRes();
      await stripeController.createPaymentIntent(
        { body: { couponApplied: false }, user: { email: 'a@b.com' } },
        res,
      );

      // The bug: the catch block logged and returned, so `res` was never
      // touched and the request hung until the client timed out.
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        err: 'Failed to create payment intent',
      });
    });

    it('responds 500 when the cart lookup throws', async () => {
      Cart.findOne.mockImplementationOnce(() => ({
        exec: () => Promise.reject(new Error('db down')),
      }));

      const res = mockRes();
      await stripeController.createPaymentIntent(
        { body: { couponApplied: false }, user: { email: 'a@b.com' } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        err: 'Failed to create payment intent',
      });
    });
  });
});
