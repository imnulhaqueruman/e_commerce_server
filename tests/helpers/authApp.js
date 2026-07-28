const express = require('express');
const bodyParser = require('body-parser');

/**
 * Minimal Express app that mounts only the auth routes under /api,
 * matching production route mounting. Callers must set up any middleware
 * mocks before requiring this module / calling createAuthApp.
 */
function createAuthApp() {
  // Clear cached router so it re-requires mocked middleware after jest.mock.
  delete require.cache[require.resolve('../../routes/auth')];
  const authRoutes = require('../../routes/auth');

  const app = express();
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use('/api', authRoutes);
  return app;
}

module.exports = { createAuthApp };
