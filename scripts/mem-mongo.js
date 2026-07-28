// Boots an in-process MongoDB and prints its URI on stdout,
// then keeps running until killed. Used only when USE_MEMORY_MONGO=1
// and no local mongod is available.
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const dbName = process.env.DB_NAME || 'ecommerce';
  const mem = await MongoMemoryServer.create({ instance: { dbName } });
  const uri = mem.getUri();
  console.log(uri);
  // Hold the process open
  process.on('SIGTERM', async () => {
    await mem.stop();
    process.exit(0);
  });
  // Keep alive
  setInterval(() => {}, 1 << 30);
})().catch((err) => {
  console.error('mem-mongo failed:', err.message);
  process.exit(1);
});