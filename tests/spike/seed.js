/**
 * Spike Test Seed Script
 * Seeds test data into MongoDB for spike tests to use.
 * Must be run before spike tests start.
 * Run on same server as npm run dev (port 6060).
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import slugify from "slugify";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const SPIKE_PREFIX = "SPIKE_";

// ---- model schemas (inline to avoid importing app modules) ----
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    phone: String,
    address: String,
    answer: String,
    role: { type: Number, default: 0 },
    DOB: Date,
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
});

const productSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    description: String,
    price: Number,
    category: mongoose.ObjectId,
    quantity: Number,
    shipping: Boolean,
    photo: { data: Buffer, contentType: String },
  },
  { timestamps: true }
);

const seed = async () => {
  try {
    console.log("\n🌱 Starting spike test data seeding...");

    await mongoose.connect(MONGO_URL);

    const User = mongoose.models.users || mongoose.model("users", userSchema);
    const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
    const Product = mongoose.models.Products || mongoose.model("Products", productSchema);

    // ---- Clean any leftover spike data ----
    console.log("🧹 Cleaning previous spike test data...");
    await User.deleteMany({ email: new RegExp(`^spike_.*@test\\.com$`, "i") });
    await Category.deleteMany({ name: new RegExp(`^${SPIKE_PREFIX}`) });
    const oldCats = await Category.find({ name: new RegExp(`^${SPIKE_PREFIX}`) });
    const oldCatIds = oldCats.map((c) => c._id);
    await Product.deleteMany({ $or: [{ name: new RegExp(`^${SPIKE_PREFIX}`) }, { category: { $in: oldCatIds } }] });

    // ---- Seed test users for spike tests (10 users for parallel logins) ----
    console.log("👥 Creating spike test users...");
    const passwordHash = await bcrypt.hash("Spike@test123", 10);
    const users = [];

    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        name: `${SPIKE_PREFIX}User${i}`,
        email: `spike_user${i}@test.com`,
        password: passwordHash,
        phone: `${String(i).padStart(10, "0")}`,
        address: `${i} Spike Test St, Load City`,
        answer: "spiketest",
        role: 0,
      });
      users.push(user);
    }
    console.log(`   ✅ Created ${users.length} test users`);

    // ---- Seed test categories and products ----
    console.log("📦 Creating spike test products...");
    const categories = [];

    for (let i = 1; i <= 5; i++) {
      const cat = await Category.create({
        name: `${SPIKE_PREFIX}Category${i}`,
        slug: slugify(`${SPIKE_PREFIX}Category${i}`, { lower: true }),
      });
      categories.push(cat);
    }
    console.log(`   ✅ Created ${categories.length} test categories`);

    // Create 20 products spread across categories
    let productCount = 0;
    for (let i = 1; i <= 20; i++) {
      const catIdx = (i - 1) % categories.length;
      await Product.create({
        name: `${SPIKE_PREFIX}Product${i}`,
        slug: slugify(`${SPIKE_PREFIX}Product${i}`, { lower: true }),
        description: `Performance test product for spike testing - ${i}`,
        price: 10 + i * 5,
        category: categories[catIdx]._id,
        quantity: 1000,
        shipping: true,
      });
      productCount++;
    }
    console.log(`   ✅ Created ${productCount} test products`);

    console.log("\n✨ Spike test data seeded successfully!");
    console.log(`📊 Total: ${users.length} users, ${categories.length} categories, ${productCount} products\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
