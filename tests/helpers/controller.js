/**
 * Shared helpers for controller unit tests (no Express, no real DB).
 */

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

/** `{ exec: () => Promise.resolve(value) }` — matches awaited Mongoose queries. */
function makeExec(value) {
  return { exec: jest.fn(() => Promise.resolve(value)) };
}

/** Rejecting exec variant. */
function makeExecReject(err) {
  return { exec: jest.fn(() => Promise.reject(err)) };
}

/**
 * Chainable query mock: find().sort().populate().limit().skip().exec()
 * Terminal `exec` resolves to `value`. Extra chained methods return `this`.
 */
function makeQuery(value, extraMethods = []) {
  const q = {
    exec: jest.fn(() => Promise.resolve(value)),
    sort: jest.fn(function () {
      return this;
    }),
    populate: jest.fn(function () {
      return this;
    }),
    limit: jest.fn(function () {
      return this;
    }),
    skip: jest.fn(function () {
      return this;
    }),
    select: jest.fn(function () {
      return this;
    }),
    lean: jest.fn(function () {
      return Promise.resolve(value);
    }),
  };
  for (const m of extraMethods) {
    q[m] = jest.fn(function () {
      return this;
    });
  }
  return q;
}

/** Constructor mock for `new Model(doc).save()`. */
function mockModelConstructor() {
  const Mock = jest.fn().mockImplementation(function (doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Mock.__makeExec = makeExec;
  Mock.__makeQuery = makeQuery;
  return Mock;
}

module.exports = {
  mockRes,
  makeExec,
  makeExecReject,
  makeQuery,
  mockModelConstructor,
};
