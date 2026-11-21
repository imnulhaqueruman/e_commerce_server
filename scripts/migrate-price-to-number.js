/**
 * One-off, idempotent migration: `Product.price` String -> Number.
 *
 * The Product schema stored prices as strings, which made range filters and
 * sorts lexicographic ("5" sorted after "100.00"). The schema now declares
 * `price` as a Number; this script converts the existing rows.
 *
 * Safe to run more than once -- already-numeric prices are skipped.
 * Unparseable prices are REPORTED, not coerced to 0, so a typo in a price
 * is visible instead of silently becoming free.
 *
 * Usage:
 *   node scripts/migrate-price-to-number.js
 *
 * Honours MONGO_URI / DB_NAME the same way the server does. Set
 * USE_MEMORY_MONGO=1 to run against a throwaway in-memory database (useful
 * for a dry run of the script itself).
 */
require('dotenv').config();

const mongoose = require('mongoose');

const DB_NAME = process.env.DB_NAME || 'ecommerce';
const resolveMongoUri = () =>
  process.env.MONGO_URI || `mongodb://localhost:27017/${DB_NAME}`;

const main = async () => {
  const uri = resolveMongoUri();
  console.log(`Connecting to ${uri}`);

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  console.log('Connected.');

  // `Product` is loaded after the connection so the model picks up the
  // connection instance.
  const Product = require('../models/product');

  const products = await Product.find({}).exec();
  console.log(`Found ${products.length} product(s).`);

  let converted = 0;
  let skipped = 0;
  const unparseable = [];

  for (const product of products) {
    const raw = product.price;

    if (typeof raw === 'number') {
      skipped += 1;
      continue;
    }

    const parsed = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ''));

    if (!Number.isFinite(parsed)) {
      unparseable.push({ id: product._id, title: product.title, price: raw });
      continue;
    }

    // Write through the raw driver so the schema cast does not interfere
    // with the migration itself.
    await mongoose.connection
      .collection('products')
      .updateOne({ _id: product._id }, { $set: { price: parsed } });

    converted += 1;
  }

  console.log(`\nConverted: ${converted}`);
  console.log(`Already numeric (skipped): ${skipped}`);

  if (unparseable.length > 0) {
    console.log(`\nCould not parse ${unparseable.length} price(s) — left unchanged:`);
    for (const item of unparseable) {
      console.log(`  - ${item.title} (${item.id}): ${JSON.stringify(item.price)}`);
    }
    console.log('\nFix these by hand before serving real traffic.');
  } else {
    console.log('\nAll prices converted cleanly.');
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
