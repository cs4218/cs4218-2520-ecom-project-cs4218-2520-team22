/**
 * Sprint 2 — Product API Integration Tests
 * Covers: Product CRUD, Search, Filter, Pagination
 * Approach: Bottom-up integration (real DB via MongoMemoryServer, real HTTP via supertest)
 *
 * QINZHE Wang, A0337880U
 */

import request from "supertest";
import { connect, disconnect, clearCollections } from "./helpers/db.js";
import { createAdmin, createUser, tokenFor } from "./helpers/auth.js";
import { createCategory, createProduct } from "./helpers/seed.js";
import createApp from "./helpers/testApp.js";
import productModel from "../models/productModel.js";

let app;
let adminUser;
let regularUser;
let adminToken;
let userToken;
let testCategory;

beforeAll(async () => {
  await connect();
  app = createApp();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearCollections();
  adminUser = await createAdmin();
  regularUser = await createUser();
  adminToken = tokenFor(adminUser);
  userToken = tokenFor(regularUser);
  testCategory = await createCategory({ name: "Electronics" });
});

// ---------------------------------------------------------------------------
// Story 2.1 — Product CRUD Integration
// ---------------------------------------------------------------------------
describe("Story 2.1 — Product CRUD Integration", () => {
  // PROD-INT-01
  test("PROD-INT-01: Create product with required fields persists in DB", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "Blue Shirt")
      .field("description", "A nice blue shirt")
      .field("price", "29.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "50")
      .field("shipping", "true");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.products.name).toBe("Blue Shirt");

    const inDb = await productModel.findOne({ name: "Blue Shirt" });
    expect(inDb).not.toBeNull();
    expect(inDb.category.toString()).toBe(testCategory._id.toString());
    expect(inDb.slug).toBe("Blue-Shirt");
  });

  // PROD-INT-02
  test("PROD-INT-02: Create product — missing name returns validation error", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("description", "No name product")
      .field("price", "29.99")
      .field("category", testCategory._id.toString())
      .field("quantity", "10");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Name is Required");
  });

  // PROD-INT-03
  test("PROD-INT-03: Create product — missing price returns validation error", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "No Price Product")
      .field("description", "Missing price")
      .field("category", testCategory._id.toString())
      .field("quantity", "10");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Price is Required");
  });

  // PROD-INT-04: Photo >1MB triggers validation error
  // BUG NOTE: The validation check is `photo && photo.size > 1000000`.
  // When using supertest .attach(), the file is actually sent.
  // We test this case with a Buffer > 1MB via the attach mechanism.
  test("PROD-INT-04: Create product with photo >1MB returns size error", async () => {
    // Mark Wang, A0000000X
    const bigBuffer = Buffer.alloc(1_100_000, "x"); // 1.1 MB
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "Big Photo Product")
      .field("description", "Product with huge image")
      .field("price", "10")
      .field("category", testCategory._id.toString())
      .field("quantity", "1")
      .attach("photo", bigBuffer, { filename: "big.jpg", contentType: "image/jpeg" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Photo/i);
  });

  // PROD-INT-05
  // BUG: requireSignIn with no token silently catches the JWT error and never
  // sends a response, so the request hangs. Using a non-admin (regular user)
  // token instead — requireSignIn passes but isAdmin returns 401.
  test("PROD-INT-05: Create product with non-admin token returns 401", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", userToken)
      .field("name", "Sneaky Product")
      .field("description", "Should be blocked")
      .field("price", "10")
      .field("category", testCategory._id.toString())
      .field("quantity", "1");

    expect(res.status).toBe(401);
  });

  // PROD-INT-06
  test("PROD-INT-06: Get all products returns max 12 sorted by createdAt desc", async () => {
    // Mark Wang, A0000000X
    await createProduct(testCategory._id, { name: "Product A" });
    await createProduct(testCategory._id, { name: "Product B" });
    await createProduct(testCategory._id, { name: "Product C" });

    const res = await request(app).get("/api/v1/product/get-product");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(3);
    // sorted descending by createdAt — Product C should be first
    expect(res.body.products[0].name).toBe("Product C");
  });

  // PROD-INT-07
  test("PROD-INT-07: Get single product by slug returns product with populated category", async () => {
    // Mark Wang, A0000000X
    await createProduct(testCategory._id, { name: "Red Shoes" });

    const res = await request(app).get("/api/v1/product/get-product/Red-Shoes");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product.name).toBe("Red Shoes");
    expect(res.body.product.category).toBeDefined();
    expect(res.body.product.category.name).toBe("Electronics");
  });

  // PROD-INT-08
  test("PROD-INT-08: Get product with invalid slug returns null product", async () => {
    // Mark Wang, A0000000X
    const res = await request(app).get("/api/v1/product/get-product/no-such-slug");

    expect(res.status).toBe(200);
    expect(res.body.product).toBeNull();
  });

  // PROD-INT-09
  test("PROD-INT-09: Get product photo returns binary data with content-type header", async () => {
    // Mark Wang, A0000000X
    // Seed a product with photo data directly via the model
    const photoBuffer = Buffer.from([0xff, 0xd8, 0xff]); // minimal JPEG header
    const product = await productModel.create({
      name: "Photo Product",
      slug: "Photo-Product",
      description: "Has a photo",
      price: 50,
      category: testCategory._id,
      quantity: 5,
      photo: { data: photoBuffer, contentType: "image/jpeg" },
    });

    const res = await request(app).get(`/api/v1/product/product-photo/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image\/jpeg/i);
    // Response body should contain the binary data
    expect(res.body).toBeDefined();
  });

  // PROD-INT-10
  test("PROD-INT-10: Update product fields persists changes in DB", async () => {
    // Mark Wang, A0000000X
    const product = await createProduct(testCategory._id, { name: "Old Name", price: 10 });

    const res = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", adminToken)
      .field("name", "New Name")
      .field("description", "Updated description")
      .field("price", "99")
      .field("category", testCategory._id.toString())
      .field("quantity", "20");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const inDb = await productModel.findById(product._id);
    expect(inDb.name).toBe("New Name");
    expect(inDb.price).toBe(99);
    expect(inDb.slug).toBe("New-Name");
  });

  // PROD-INT-11
  test("PROD-INT-11: Update product with non-admin token returns 401", async () => {
    // Mark Wang, A0000000X
    const product = await createProduct(testCategory._id, { name: "Locked Product" });

    const res = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", userToken)
      .field("name", "Hacked Name")
      .field("description", "Unauthorized update")
      .field("price", "1")
      .field("category", testCategory._id.toString())
      .field("quantity", "1");

    expect(res.status).toBe(401);

    // Product should be unchanged in DB
    const inDb = await productModel.findById(product._id);
    expect(inDb.name).toBe("Locked Product");
  });

  // PROD-INT-12
  test("PROD-INT-12: Delete product with admin token removes it from DB", async () => {
    // Mark Wang, A0000000X
    const product = await createProduct(testCategory._id, { name: "Disposable" });

    const res = await request(app)
      .delete(`/api/v1/product/delete-product/${product._id}`)
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const inDb = await productModel.findById(product._id);
    expect(inDb).toBeNull();
  });

  // PROD-INT-13
  // Bug fixed: DELETE /delete-product/:pid now requires requireSignIn + isAdmin.
  // Unauthenticated requests should receive 401.
  test("PROD-INT-13: Delete product without token returns 401 (auth middleware now present)", async () => {
    // Mark Wang, A0000000X
    const product = await createProduct(testCategory._id, { name: "Protected Product" });

    // No Authorization header sent
    const res = await request(app)
      .delete(`/api/v1/product/delete-product/${product._id}`);

    expect(res.status).toBe(401);
    // Product must still exist in DB
    const inDb = await productModel.findById(product._id);
    expect(inDb).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Story 2.2 — Product Search & Filter Integration
// ---------------------------------------------------------------------------
describe("Story 2.2 — Product Search & Filter Integration", () => {
  let category2;

  beforeEach(async () => {
    category2 = await createCategory({ name: "Clothing" });
    await createProduct(testCategory._id, { name: "Laptop Pro", description: "Powerful laptop", price: 1200 });
    await createProduct(testCategory._id, { name: "Wireless Mouse", description: "Ergonomic mouse for laptop users", price: 30 });
    await createProduct(category2._id, { name: "Blue Shirt", description: "Cotton shirt", price: 25 });
  });

  // SRCH-INT-01
  test("SRCH-INT-01: Search by keyword matching product name", async () => {
    // Mark Wang, A0000000X
    const res = await request(app).get("/api/v1/product/search/Laptop");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const names = res.body.map((p) => p.name);
    expect(names).toContain("Laptop Pro");
  });

  // SRCH-INT-02
  test("SRCH-INT-02: Search by keyword matching description", async () => {
    // Mark Wang, A0000000X
    // "laptop" appears in the description of Wireless Mouse
    const res = await request(app).get("/api/v1/product/search/Ergonomic");

    expect(res.status).toBe(200);
    const names = res.body.map((p) => p.name);
    expect(names).toContain("Wireless Mouse");
  });

  // SRCH-INT-03
  test("SRCH-INT-03: Search with no matches returns empty array", async () => {
    // Mark Wang, A0000000X
    const res = await request(app).get("/api/v1/product/search/xyznotfound99999");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // SRCH-INT-04
  test("SRCH-INT-04: Search is case-insensitive", async () => {
    // Mark Wang, A0000000X
    const resUpper = await request(app).get("/api/v1/product/search/LAPTOP");
    const resLower = await request(app).get("/api/v1/product/search/laptop");

    expect(resUpper.status).toBe(200);
    expect(resLower.status).toBe(200);
    expect(resUpper.body.map((p) => p.name)).toEqual(resLower.body.map((p) => p.name));
  });

  // FILT-INT-01
  test("FILT-INT-01: Filter by single category returns only products from that category", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [testCategory._id.toString()], radio: [] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.products.map((p) => p.name);
    expect(names).toContain("Laptop Pro");
    expect(names).toContain("Wireless Mouse");
    expect(names).not.toContain("Blue Shirt");
  });

  // FILT-INT-02
  test("FILT-INT-02: Filter by price range returns only products within range", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [], radio: [20, 50] });

    expect(res.status).toBe(200);
    const names = res.body.products.map((p) => p.name);
    expect(names).toContain("Wireless Mouse"); // 30
    expect(names).toContain("Blue Shirt");      // 25
    expect(names).not.toContain("Laptop Pro");  // 1200
  });

  // FILT-INT-03
  test("FILT-INT-03: Filter by category + price returns intersection", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [testCategory._id.toString()], radio: [20, 50] });

    expect(res.status).toBe(200);
    const names = res.body.products.map((p) => p.name);
    expect(names).toContain("Wireless Mouse"); // Electronics, $30
    expect(names).not.toContain("Laptop Pro"); // Electronics but $1200 — out of range
    expect(names).not.toContain("Blue Shirt"); // Clothing
  });

  // FILT-INT-04
  test("FILT-INT-04: Filter with no matches returns empty array", async () => {
    // Mark Wang, A0000000X
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [], radio: [5000, 10000] });

    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Story 2.3 — Product Pagination Integration
// ---------------------------------------------------------------------------
describe("Story 2.3 — Product Pagination Integration", () => {
  beforeEach(async () => {
    // Seed 8 products so pagination can be tested (perPage = 6)
    for (let i = 1; i <= 8; i++) {
      await createProduct(testCategory._id, { name: `Product ${i}` });
    }
  });

  // PAGE-INT-01
  test("PAGE-INT-01: Product count matches DB count", async () => {
    // Mark Wang, A0000000X
    const res = await request(app).get("/api/v1/product/product-count");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(8);
  });

  // PAGE-INT-02
  test("PAGE-INT-02: Page 1 returns first 6 products", async () => {
    // Mark Wang, A0000000X
    const res = await request(app).get("/api/v1/product/product-list/1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBe(6);
  });

  // PAGE-INT-03
  test("PAGE-INT-03: Page 2 returns remaining 2 products (different from page 1)", async () => {
    // Mark Wang, A0000000X
    const page1 = await request(app).get("/api/v1/product/product-list/1");
    const page2 = await request(app).get("/api/v1/product/product-list/2");

    expect(page2.status).toBe(200);
    expect(page2.body.products.length).toBe(2);

    const page1Ids = page1.body.products.map((p) => p._id);
    const page2Ids = page2.body.products.map((p) => p._id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  // PAGE-INT-04
  test("PAGE-INT-04: Get products by category slug returns only products in that category", async () => {
    // Mark Wang, A0000000X
    const otherCat = await createCategory({ name: "Books" });
    await createProduct(otherCat._id, { name: "Novel X" });

    const res = await request(app).get(`/api/v1/product/product-category/${testCategory.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.products.map((p) => p.name);
    expect(names.every((n) => n.startsWith("Product "))).toBe(true);
    expect(names).not.toContain("Novel X");
  });

  // PAGE-INT-05
  test("PAGE-INT-05: Get related products returns up to 3, same category, excluding given pid", async () => {
    // Mark Wang, A0000000X
    // All 8 seeded products are in testCategory
    const allProducts = await productModel.find({ category: testCategory._id });
    const target = allProducts[0];

    const res = await request(app)
      .get(`/api/v1/product/related-product/${target._id}/${testCategory._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products.length).toBeLessThanOrEqual(3);
    const ids = res.body.products.map((p) => p._id.toString());
    expect(ids).not.toContain(target._id.toString());
    // All returned products must be in the same category
    res.body.products.forEach((p) => {
      expect(p.category._id.toString()).toBe(testCategory._id.toString());
    });
  });
});
