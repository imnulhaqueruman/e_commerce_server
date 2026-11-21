/**
 * End-to-end smoke test for the cart -> coupon -> order flow.
 *
 * Runs against a live server and exercises the contracts that were broken
 * before the Phase 0 fixes:
 *   - B5: coupon response shape (`couponApplied` object, 400 on a miss)
 *   - B6: empty cart returns an empty shape, not a 500
 *   - B4: `POST /api/user/profile` exists
 *   - B15: the paginated product-list shape
 *
 * Usage: node scripts/smoke-cart-flow.js [baseUrl]
 * Assumes the API is already running and reachable.
 */
const BASE = process.argv[2] || 'http://localhost:5000';

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

const assert = (label, condition, detail) => {
  if (condition) {
    console.log(`  PASS  ${label}`);
    return true;
  }
  console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  process.exitCode = 1;
  return false;
};

(async () => {
  console.log(`Smoke testing ${BASE}\n`);

  // --- auth ---------------------------------------------------------------
  const email = `smoke-${Date.now()}@example.com`;
  const reg = await request('POST', '/auth/register', {
    body: { email, password: 'secret123', name: 'Smoke' },
  });
  assert('register returns a token', Boolean(reg.data?.token), JSON.stringify(reg.data));
  assert('register response omits the password', !reg.data?.user?.password);
  const token = reg.data.token;

  // --- empty cart (B6) ----------------------------------------------------
  const empty = await request('GET', '/user/cart', { token });
  assert('empty cart returns 200', empty.status === 200, String(empty.status));
  assert(
    'empty cart returns an empty product list',
    Array.isArray(empty.data?.products) && empty.data.products.length === 0,
  );
  assert('empty cart returns couponApplied: null', empty.data?.couponApplied === null);

  // --- invalid coupon (B5) ------------------------------------------------
  const badCoupon = await request('POST', '/user/cart/coupon', {
    token,
    body: { coupon: 'NOSUCHCODE1' },
  });
  assert('invalid coupon returns 400', badCoupon.status === 400, String(badCoupon.status));
  assert('invalid coupon returns an err message', Boolean(badCoupon.data?.err));

  // --- profile (B4) -------------------------------------------------------
  const profile = await request('POST', '/user/profile', {
    token,
    body: { name: 'Renamed', address: '1 Test St' },
  });
  assert('profile update returns 200', profile.status === 200, String(profile.status));
  assert('profile update returns the user', profile.data?.user?.name === 'Renamed');
  assert('profile response omits the password', !profile.data?.user?.password);

  // --- current user must not leak the hash (B10) --------------------------
  const me = await request('GET', '/auth/current-user', { token });
  assert('current-user returns 200', me.status === 200, String(me.status));
  assert('current-user omits the password', !me.data?.password);

  // --- product list shape (B15) -------------------------------------------
  const list = await request('POST', '/products', { body: {} });
  assert(
    'product list returns the paginated shape',
    Array.isArray(list.data?.items) && typeof list.data?.total === 'number',
  );
  assert('product list defaults perPage to 24', list.data?.perPage === 24);

  // --- search filters compose (B8) ----------------------------------------
  const search = await request('POST', '/search/filters', {
    body: { query: 'phone', price: [10, 500], brand: 'Apple' },
  });
  assert('search filters returns an array', Array.isArray(search.data));

  // --- admin stats --------------------------------------------------------
  const stats = await request('GET', '/admin/stats', { token });
  assert(
    'admin stats rejects a non-admin with 403',
    stats.status === 403,
    String(stats.status),
  );

  // --- health -------------------------------------------------------------
  const health = await request('GET', '/health');
  assert('health returns ok', health.status === 200 && health.data?.ok === true);

  console.log(process.exitCode ? '\nSmoke test FAILED' : '\nSmoke test passed');
})().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
