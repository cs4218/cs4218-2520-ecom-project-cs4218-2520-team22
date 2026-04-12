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
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_FILE = path.join(__dirname, "product-photos.csv");

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

    // Create a simple 1x1 pixel PNG placeholder for photos (1027 bytes)
    // This is a minimal valid PNG file that can be used for testing
    const placeholderPhoto = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    // Create 20 products spread across categories
    let productCount = 0;
    const productIds = [];
    for (let i = 1; i <= 20; i++) {
      const catIdx = (i - 1) % categories.length;
      const product = await Product.create({
        name: `${SPIKE_PREFIX}Product${i}`,
        slug: slugify(`${SPIKE_PREFIX}Product${i}`, { lower: true }),
        description: `Performance test product for spike testing - ${i}`,
        price: 10 + i * 5,
        category: categories[catIdx]._id,
        quantity: 1000,
        shipping: true,
        photo: {
          data: placeholderPhoto,
          contentType: "image/png",
        },
      });
      productIds.push(product);
      productCount++;
    }
    console.log(`   ✅ Created ${productCount} test products (with placeholder photos)`);

    // Generate CSV with product IDs and backend photo URLs
    const BACKEND_HOST = process.env.PORT || 3000;
    const BACKEND_URL_BASE = `http://localhost:${BACKEND_HOST}/api/v1/product/product-photo`;
    
    const csvRows = ["productSlug,productName,productId,photoBackendUrl"];
    productIds.forEach((product) => {
      const photoUrl = `${BACKEND_URL_BASE}/${product._id}`;
      csvRows.push(
        `${product.slug},${product.name},${product._id},"${photoUrl}"`
      );
    });

    fs.writeFileSync(CSV_FILE, csvRows.join("\n"), "utf-8");
    console.log(`   ✅ Generated ${CSV_FILE}`);

    console.log("\n✨ Spike test data seeded successfully!");
    console.log(`📊 Total: ${users.length} users, ${categories.length} categories, ${productCount} products`);
    console.log(`📄 CSV: ${CSV_FILE}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
