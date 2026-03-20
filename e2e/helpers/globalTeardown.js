/**
 * Playwright globalTeardown — removes all E2E-prefixed test data from MongoDB.
 *
 * QINZHE Wang, A0337880U
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URL = process.env.MONGO_TEST_URL || process.env.MONGO_URL;
const E2E_PREFIX = "E2E ";

const teardown = async () => {
  await mongoose.connect(MONGO_URL);

  const collections = mongoose.connection.collections;

  // users: email starts with "e2e."
  if (collections.users) {
    await collections.users.deleteMany({ email: /^e2e\./i });
  }
  // categories: name starts with E2E_PREFIX
  if (collections.categories) {
    await collections.categories.deleteMany({ name: new RegExp(`^${E2E_PREFIX}`) });
  }
  // products: name starts with E2E_PREFIX
  if (collections.products) {
    await collections.products.deleteMany({ name: new RegExp(`^${E2E_PREFIX}`) });
  }
  // orders seeded with e2eTest marker
  if (collections.orders) {
    await collections.orders.deleteMany({ "payment.e2eTest": true });
  }
  // dynamic registrations during tests (email pattern e2e.reg*)
  if (collections.users) {
    await collections.users.deleteMany({ email: /^e2e\./i });
  }

  await mongoose.disconnect();
};

export default teardown;
