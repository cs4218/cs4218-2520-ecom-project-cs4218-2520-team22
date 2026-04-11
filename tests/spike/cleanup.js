/**
 * Spike Test Cleanup Script
 * Removes all spike test data from MongoDB after tests complete.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URL = process.env.MONGO_TEST_URL || process.env.MONGO_URL;

const cleanup = async () => {
  try {
    console.log("\n🧹 Starting spike test cleanup...");

    await mongoose.connect(MONGO_URL);

    const collections = mongoose.connection.collections;

    // ---- Remove spike test users (email pattern: spike_*@test.com) ----
    if (collections.users) {
      const deletedUsers = await collections.users.deleteMany({ email: /^spike_.*@test\.com$/i });
      console.log(`   ✅ Deleted users: ${deletedUsers.deletedCount}`);
    }

    // ---- Remove spike test categories (name starts with SPIKE_) ----
    if (collections.categories) {
      const deletedCats = await collections.categories.deleteMany({ name: /^SPIKE_/i });
      console.log(`   ✅ Deleted categories: ${deletedCats.deletedCount}`);
    }

    // ---- Remove spike test products (name starts with SPIKE_) ----
    if (collections.products) {
      const deletedProds = await collections.products.deleteMany({ name: /^SPIKE_/i });
      console.log(`   ✅ Deleted products: ${deletedProds.deletedCount}`);
    }

    console.log("\n✨ Spike test cleanup completed!\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

cleanup();
