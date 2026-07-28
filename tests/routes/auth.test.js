jest.mock('../../middlewares/auth', () => ({
  authCheck: (req, res, next) => {
    const token = req.headers.authtoken;
    if (!token || token === 'invalid') {
      return res.status(401).json({ err: 'Invalid or expired token' });
    }
    req.user = {
      email: req.headers['x-test-email'] || 'firebase@example.com',
      name: 'Firebase User',
      picture: 'https://example.com/pic.png',
    };
    return next();
  },
  adminCheck: async (req, res, next) => {
    const User = require('../../models/user');
    try {
      const adminUser = await User.findOne({ email: req.user.email }).exec();
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ err: 'Admin resource. Access denied' });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ err: 'Failed to verify admin' });
    }
  },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createAuthApp } = require('../helpers/authApp');
const { connectDb, clearDb, closeDb } = require('../helpers/db');
const User = require('../../models/user');

describe('routes/auth.js', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = createAuthApp();
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: 'secret123',
          name: 'New User',
        })
        .expect(200);

      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
        role: 'subscribe',
      });
      expect(res.body.user.password).toBeUndefined();

      const saved = await User.findOne({ email: 'new@example.com' }).exec();
      expect(saved).toBeTruthy();
      expect(saved.password).not.toBe('secret123');
    });

    it('defaults name from email local-part when name is omitted', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'alice@example.com', password: 'secret123' })
        .expect(200);

      expect(res.body.user.name).toBe('alice');
    });

    it('rejects missing email or password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-pass@example.com' })
        .expect(400);

      expect(res.body.err).toMatch(/required/i);
    });

    it('rejects duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', password: 'secret123' })
        .expect(200);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', password: 'otherpass' })
        .expect(400);

      expect(res.body.err).toMatch(/already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'login@example.com', password: 'secret123', name: 'Login' });
    });

    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'secret123' })
        .expect(200);

      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: 'login@example.com',
        name: 'Login',
      });
      expect(res.body.user.password).toBeUndefined();
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrong' })
        .expect(401);

      expect(res.body.err).toMatch(/invalid/i);
    });

    it('rejects unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'secret123' })
        .expect(401);

      expect(res.body.err).toMatch(/invalid/i);
    });

    it('rejects missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(res.body.err).toMatch(/required/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('acknowledges logout', async () => {
      const res = await request(app).post('/api/auth/logout').expect(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('GET /api/auth/current-user', () => {
    let token;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ email: 'me@example.com', password: 'secret123', name: 'Me' });
      token = reg.body.token;
    });

    it('returns the authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/current-user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe('me@example.com');
      expect(res.body.name).toBe('Me');
    });

    it('rejects missing token', async () => {
      const res = await request(app).get('/api/auth/current-user').expect(401);
      expect(res.body.err).toMatch(/no token/i);
    });

    it('rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/current-user')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);

      expect(res.body.err).toMatch(/invalid or expired/i);
    });

    it('rejects token signed with a different secret', async () => {
      const bad = jwt.sign({ email: 'me@example.com' }, 'other-secret', {
        expiresIn: '7d',
      });
      const res = await request(app)
        .get('/api/auth/current-user')
        .set('Authorization', `Bearer ${bad}`)
        .expect(401);

      expect(res.body.err).toMatch(/invalid or expired/i);
    });
  });

  describe('legacy Firebase endpoints', () => {
    describe('POST /api/create-or-update-user', () => {
      it('rejects invalid Firebase token', async () => {
        const res = await request(app)
          .post('/api/create-or-update-user')
          .set('authtoken', 'invalid')
          .expect(401);

        expect(res.body.err).toMatch(/invalid or expired/i);
      });

      it('creates a user on first call', async () => {
        const res = await request(app)
          .post('/api/create-or-update-user')
          .set('authtoken', 'valid-firebase')
          .set('x-test-email', 'firebase@example.com')
          .expect(200);

        expect(res.body.email).toBe('firebase@example.com');
        expect(res.body.name).toBe('firebase');
      });

      it('updates an existing user on subsequent call', async () => {
        await request(app)
          .post('/api/create-or-update-user')
          .set('authtoken', 'valid-firebase')
          .set('x-test-email', 'firebase@example.com')
          .expect(200);

        const res = await request(app)
          .post('/api/create-or-update-user')
          .set('authtoken', 'valid-firebase')
          .set('x-test-email', 'firebase@example.com')
          .expect(200);

        expect(res.body.email).toBe('firebase@example.com');
        const count = await User.countDocuments({ email: 'firebase@example.com' });
        expect(count).toBe(1);
      });
    });

    describe('POST /api/current-user', () => {
      it('returns the current user when Firebase token is valid', async () => {
        await User.create({
          email: 'firebase@example.com',
          name: 'Firebase',
          role: 'subscribe',
        });

        const res = await request(app)
          .post('/api/current-user')
          .set('authtoken', 'valid-firebase')
          .set('x-test-email', 'firebase@example.com')
          .expect(200);

        expect(res.body.email).toBe('firebase@example.com');
      });

      it('rejects missing authtoken', async () => {
        await request(app).post('/api/current-user').expect(401);
      });
    });

    describe('POST /api/current-admin', () => {
      it('allows admin users', async () => {
        await User.create({
          email: 'admin@example.com',
          name: 'Admin',
          role: 'admin',
        });

        const res = await request(app)
          .post('/api/current-admin')
          .set('authtoken', 'valid-firebase')
          .set('x-test-email', 'admin@example.com')
          .expect(200);

        expect(res.body.email).toBe('admin@example.com');
        expect(res.body.role).toBe('admin');
      });

      it('denies non-admin users', async () => {
        await User.create({
          email: 'user@example.com',
          name: 'User',
          role: 'subscribe',
        });

        const res = await request(app)
          .post('/api/current-admin')
          .set('authtoken', 'valid-firebase')
          .set('x-test-email', 'user@example.com')
          .expect(403);

        expect(res.body.err).toMatch(/admin/i);
      });
    });
  });
});
