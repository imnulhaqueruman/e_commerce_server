// Direct unit tests for controllers/auth.js - no Express, no routing.
process.env.JWT_SECRET = 'controller-test-secret';
process.env.NODE_ENV = 'test';

// Mock the User model. User is a class; controllers call it via `new`.
// We expose query helpers (findOne, findOneAndUpdate) that return objects
// with an `exec()` method to match the way Mongoose queries are awaited.
jest.mock('../../models/user', () => {
  const MockUser = jest.fn().mockImplementation(function (doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  });
  // query helper: returns { exec: () => Promise.resolve(value) }
  const makeExec = (value) => ({ exec: () => Promise.resolve(value) });
  MockUser.findOne = jest.fn(() => makeExec(null));
  MockUser.findOneAndUpdate = jest.fn();
  // expose helper for tests
  MockUser.__execResult = (v) => makeExec(v);
  MockUser.__directResult = (v) => Promise.resolve(v);
  return MockUser;
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

const auth = require('../../controllers/auth');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function lastInstance() {
  const instances = User.mock.instances;
  return instances[instances.length - 1];
}

beforeEach(() => {
  User.mockClear();
  User.findOne.mockClear();
  User.findOneAndUpdate.mockClear();
  // re-apply default implementation after clearAllMocks wiped the constructor
  User.mockImplementation(function (doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  });
  User.findOne.mockImplementation(() => User.__execResult(null));
  User.findOneAndUpdate.mockImplementation(() => User.__directResult(null));
});

describe('controllers/auth.js', () => {
  describe('register', () => {
    it('hashes the password before persistence', async () => {
      const res = mockRes();
      await auth.register(
        { body: { email: 'a@b.com', password: 'plain', name: 'A' } },
        res,
      );

      expect(User).toHaveBeenCalledTimes(1);
      const constructed = lastInstance();
      expect(constructed).toBeDefined();
      expect(constructed.password).not.toBe('plain');
      expect(await bcrypt.compare('plain', constructed.password)).toBe(true);
      expect(constructed.save).toHaveBeenCalledTimes(1);
    });

    it('returns a sanitized user (no password field) and a JWT', async () => {
      const res = mockRes();
      await auth.register(
        { body: { email: 'a@b.com', password: 'plain', name: 'A' } },
        res,
      );

      expect(res.json).toHaveBeenCalledTimes(1);
      const payload = res.json.mock.calls[0][0];
      expect(payload.user.password).toBeUndefined();
      expect(payload.token).toEqual(expect.any(String));
      const decoded = jwt.verify(payload.token, 'controller-test-secret');
      expect(decoded.email).toBe('a@b.com');
    });

    it('falls back to email local-part when name is omitted', async () => {
      const res = mockRes();
      await auth.register(
        { body: { email: 'alice@example.com', password: 'secret123' } },
        res,
      );

      expect(lastInstance().name).toBe('alice');
    });

    it('returns 400 when email or password is missing', async () => {
      const res = mockRes();
      await auth.register({ body: { email: 'x@y.com' } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        err: 'Email and password are required',
      });
      expect(User).not.toHaveBeenCalled();
    });

    it('returns 400 when the email is already registered', async () => {
      User.findOne.mockImplementation(() => User.__execResult({ email: 'a@b.com' }));

      const res = mockRes();
      await auth.register(
        { body: { email: 'a@b.com', password: 'secret123' } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        err: 'Email is already registered',
      });
    });

    it('returns 500 when save throws', async () => {
      User.findOne.mockImplementation(() => User.__execResult(null));
      const failingSave = jest.fn().mockRejectedValue(new Error('db down'));
      User.mockImplementationOnce(function (doc) {
        Object.assign(this, doc);
        this.save = failingSave;
      });

      const res = mockRes();
      await auth.register(
        { body: { email: 'a@b.com', password: 'secret123' } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ err: 'Registration failed' });
    });
  });

  describe('login', () => {
    it('returns a token and sanitized user on valid credentials', async () => {
      const hash = await bcrypt.hash('secret123', 4);
      User.findOne.mockImplementation(() =>
        User.__execResult({
          email: 'a@b.com',
          name: 'A',
          role: 'subscribe',
          password: hash,
          toObject() {
            return { ...this };
          },
        })
      );

      const res = mockRes();
      await auth.login(
        { body: { email: 'a@b.com', password: 'secret123' } },
        res,
      );

      const payload = res.json.mock.calls[0][0];
      expect(payload.token).toEqual(expect.any(String));
      expect(payload.user.password).toBeUndefined();
      expect(payload.user.email).toBe('a@b.com');
    });

    it('returns 401 when the user has no password (Firebase-only account)', async () => {
      User.findOne.mockImplementation(() =>
        User.__execResult({
          email: 'a@b.com',
          name: 'A',
          toObject() {
            return { ...this };
          },
        })
      );

      const res = mockRes();
      await auth.login(
        { body: { email: 'a@b.com', password: 'secret123' } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        err: 'Invalid email or password',
      });
    });

    it('returns the same generic error for wrong password vs unknown email', async () => {
      const hash = await bcrypt.hash('right', 4);
      // wrong password
      User.findOne.mockImplementationOnce(() =>
        User.__execResult({
          email: 'a@b.com',
          password: hash,
          toObject() {
            return { ...this };
          },
        })
      );
      const res1 = mockRes();
      await auth.login(
        { body: { email: 'a@b.com', password: 'wrong' } },
        res1,
      );
      expect(res1.status).toHaveBeenCalledWith(401);
      expect(res1.json).toHaveBeenCalledWith({
        err: 'Invalid email or password',
      });

      // unknown email
      User.findOne.mockImplementationOnce(() => User.__execResult(null));
      const res2 = mockRes();
      await auth.login(
        { body: { email: 'nobody@example.com', password: 'secret123' } },
        res2,
      );
      expect(res2.status).toHaveBeenCalledWith(401);
      expect(res2.json.mock.calls[0][0]).toEqual(res1.json.mock.calls[0][0]);
    });

    it('returns 400 when email or password is missing', async () => {
      const res = mockRes();
      await auth.login({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        err: 'Email and password are required',
      });
    });

    it('returns 500 when the DB lookup throws', async () => {
      User.findOne.mockImplementation(() => ({
        exec: () => Promise.reject(new Error('db down')),
      }));

      const res = mockRes();
      await auth.login(
        { body: { email: 'a@b.com', password: 'secret123' } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ err: 'Login failed' });
    });
  });

  describe('logout', () => {
    it('returns { ok: true }', async () => {
      const res = mockRes();
      await auth.logout({}, res);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('createOrUpdateUser', () => {
    it('creates a new user when none exists, normalizing the name', async () => {
      User.findOneAndUpdate.mockImplementation(() => User.__directResult(null));

      const res = mockRes();
      await auth.createOrUpdateUser(
        {
          user: {
            email: 'fb@example.com',
            name: 'Firebase User',
            picture: 'https://example.com/p.png',
          },
        },
        res,
      );

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'fb@example.com' },
        { name: 'fb', picture: 'https://example.com/p.png' },
        { new: true },
      );
      expect(lastInstance()).toBeDefined();
      expect(lastInstance().name).toBe('fb');
      expect(lastInstance().save).toHaveBeenCalledTimes(1);
    });

    it('updates an existing user without creating a duplicate', async () => {
      const existing = {
        email: 'fb@example.com',
        name: 'fb',
        picture: 'old',
      };
      User.findOneAndUpdate.mockImplementation(() => User.__directResult(existing));

      const res = mockRes();
      await auth.createOrUpdateUser(
        {
          user: {
            email: 'fb@example.com',
            name: 'Firebase User',
            picture: 'https://example.com/p.png',
          },
        },
        res,
      );

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'fb@example.com' },
        { name: 'fb', picture: 'https://example.com/p.png' },
        { new: true },
      );
      expect(res.json).toHaveBeenCalledWith(existing);
      expect(User).not.toHaveBeenCalled();
    });
  });

  describe('currentUser', () => {
    it('returns the user document for the authenticated email', async () => {
      const doc = { email: 'a@b.com', name: 'A', role: 'subscribe' };
      User.findOne.mockImplementation(() => User.__execResult(doc));

      const res = mockRes();
      await auth.currentUser({ user: { email: 'a@b.com' } }, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'a@b.com' });
      expect(res.json).toHaveBeenCalledWith(doc);
    });

    it('returns 500 when the lookup throws', async () => {
      User.findOne.mockImplementation(() => ({
        exec: () => Promise.reject(new Error('db down')),
      }));

      const res = mockRes();
      await auth.currentUser({ user: { email: 'a@b.com' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ err: 'Failed to fetch user' });
    });
  });
});
