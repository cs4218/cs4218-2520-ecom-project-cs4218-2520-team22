/**
 * Playwright globalSetup — seeds E2E test data into MongoDB.
 * All seeded documents use the "E2E " prefix so globalTeardown can wipe them cleanly.
 *
 * QINZHE Wang, A0337880U
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import slugify from "slugify";

dotenv.config();

// Use MONGO_TEST_URL if set, otherwise fall back to MONGO_URL (dev DB).
const MONGO_URL = process.env.MONGO_TEST_URL || process.env.MONGO_URL;

// ---- model schemas (inline to avoid importing the app modules in globalSetup) ----
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
const orderSchema = new mongoose.Schema(
  {
    products: [{ type: mongoose.ObjectId, ref: "Products" }],
    payment: Object,
    buyer: { type: mongoose.ObjectId, ref: "users" },
    status: { type: String, default: "Not Processed" },
  },
  { timestamps: true }
);

export const E2E_USER_NAME = "E2E User";
export const E2E_USER_EMAIL = "e2e.user@test.com";
export const E2E_USER_PASSWORD = "User@e2e123";
export const E2E_USER_PHONE = "0000000002";
export const E2E_USER_ADDRESS = "2 E2E User St, Test City";

export const E2E_ADMIN_EMAIL = "e2e.admin@test.com";
export const E2E_ADMIN_PASSWORD = "Admin@e2e123";
export const E2E_PREFIX = "E2E ";

const setup = async () => {
  await mongoose.connect(MONGO_URL);

  const User = mongoose.models.users || mongoose.model("users", userSchema);
  const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
  const Product = mongoose.models.Products || mongoose.model("Products", productSchema);
  const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

  // ---- Clean any leftover E2E data from previous runs ----
  await User.deleteMany({ email: /^e2e\./i });
  await Category.deleteMany({ name: new RegExp(`^${E2E_PREFIX}`) });
  const oldCats = await Category.find({ name: new RegExp(`^${E2E_PREFIX}`) });
  const oldCatIds = oldCats.map((c) => c._id);
  await Product.deleteMany({ $or: [{ name: new RegExp(`^${E2E_PREFIX}`) }, { category: { $in: oldCatIds } }] });
  await Order.deleteMany({ "payment.e2eTest": true });

  // ---- Seed users ----
  const userHash = await bcrypt.hash(E2E_USER_PASSWORD, 10);
  const adminHash = await bcrypt.hash(E2E_ADMIN_PASSWORD, 10);

  await User.create({
    name: "E2E User",
    email: E2E_USER_EMAIL,
    password: userHash,
    phone: "0000000002",
    address: "2 E2E User St, Test City",
    answer: "e2euser",
    role: 0,
  });

  await User.create({
    name: "E2E Admin",
    email: E2E_ADMIN_EMAIL,
    password: adminHash,
    phone: "0000000001",
    address: "1 E2E Admin St, Test City",
    answer: "e2eadmin",
    role: 1,
  });

  // ---- Seed categories ----
  const electronics = await Category.create({
    name: `${E2E_PREFIX}Electronics`,
    slug: 'e2e-electronics',
  });
  const clothing = await Category.create({
    name: `${E2E_PREFIX}Clothing`,
    slug: 'e2e-clothing',
  });

  // ---- Seed 7 products (6 Electronics for load-more pagination, 1 Clothing) ----
  for (let i = 1; i <= 6; i++) {
    await Product.create({
      name: `${E2E_PREFIX}Laptop ${i}`,
      slug: slugify(`${E2E_PREFIX}Laptop ${i}`),
      description: `E2E test laptop number ${i}. Great performance.`,
      price: 100 * i,
      category: electronics._id,
      quantity: 10,
      shipping: true,
    });
  }
  const shirt = await Product.create({
    name: `${E2E_PREFIX}Blue Shirt`,
    slug: slugify(`${E2E_PREFIX}Blue Shirt`),
    description: "E2E test blue cotton shirt for all occasions.",
    price: 25,
    category: clothing._id,
    quantity: 5,
    shipping: true,
  });

  await Product.create({
    name: `${E2E_PREFIX}Green Shirt`,
    slug: slugify(`${E2E_PREFIX}Green Shirt`),
    description: "E2E test green cotton shirt for all occasions.",
    price: 1,
    category: clothing._id,
    quantity: 5,
    shipping: true,
  });

  // ---- Seed a test order (for admin orders tests) ----
  const adminUser = await User.findOne({ email: E2E_ADMIN_EMAIL });
  await Order.create({
    products: [shirt._id],
    payment: { success: true, e2eTest: true },
    buyer: adminUser._id,
    status: "Not Processed",
  });

  await mongoose.disconnect();
};

export default setup;
