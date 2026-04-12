/**
 * Spike Test Cleanup Script
 * Removes all spike test data from MongoDB after tests complete.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_TEST_URL;

const cleanup = async () => {
  try {
    console.log("\n🧹 Starting spike test cleanup...");
    console.log(`   Database: ${MONGO_URL.replace(/:[^@]*@/, ":*****@")}`);

    await mongoose.connect(MONGO_URL);
    const db = mongoose.connection.db;

    // ---- Verify collections exist before cleanup ----
    console.log("   Checking for spike test data...");

    // ---- Remove spike test users (email pattern: spike_*@test.com) ----
    const userFilter = { email: /^spike_.*@test\.com$/i };
    try {
      const userCount = await db.collection("users").countDocuments(userFilter);
      if (userCount > 0) {
        const result = await db.collection("users").deleteMany(userFilter);
        console.log(`   ✅ Deleted ${result.deletedCount} users`);
      } else {
        console.log(`   ℹ️  No spike users found`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error with users: ${error.message}`);
    }

    // ---- Remove spike test products FIRST (before categories, since products reference categories) ----
    const prodFilter = { name: /^SPIKE_/i };
    try {
      const prodCount = await db.collection("products").countDocuments(prodFilter);
      if (prodCount > 0) {
        const result = await db.collection("products").deleteMany(prodFilter);
        console.log(`   ✅ Deleted ${result.deletedCount} products`);
      } else {
        console.log(`   ℹ️  No spike products found`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error with products: ${error.message}`);
    }

    // ---- Remove spike test categories (after products) ----
    const catFilter = { name: /^SPIKE_/i };
    try {
      const catCount = await db.collection("categories").countDocuments(catFilter);
      if (catCount > 0) {
        const result = await db.collection("categories").deleteMany(catFilter);
        console.log(`   ✅ Deleted ${result.deletedCount} categories`);
      } else {
        console.log(`   ℹ️  No spike categories found`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error with categories: ${error.message}`);
    }

    // ---- Verify cleanup was effective ----
    console.log("\n   🔍 Verifying cleanup...");
    let verifyPassed = true;

    const remainingUsers = await db.collection("users").countDocuments(userFilter);
    if (remainingUsers === 0) {
      console.log("   ✅ Users verified removed");
    } else {
      console.log(`   ❌ ${remainingUsers} spike users still remain`);
      verifyPassed = false;
    }

    const remainingProds = await db.collection("products").countDocuments(prodFilter);
    if (remainingProds === 0) {
      console.log("   ✅ Products verified removed");
    } else {
      console.log(`   ❌ ${remainingProds} spike products still remain`);
      verifyPassed = false;
    }

    const remainingCats = await db.collection("categories").countDocuments(catFilter);
    if (remainingCats === 0) {
      console.log("   ✅ Categories verified removed");
    } else {
      console.log(`   ❌ ${remainingCats} spike categories still remain`);
      verifyPassed = false;
    }

    if (verifyPassed) {
      console.log("\n✨ Spike test cleanup completed successfully!\n");
    } else {
      console.log("\n⚠️  Some spike test data remains!\n");
    }

    await mongoose.disconnect();
    process.exit(verifyPassed ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error.message);
    console.error("   Stack:", error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

cleanup();
