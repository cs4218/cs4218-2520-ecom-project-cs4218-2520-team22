// written by QINZHE Wang, A0337880U

import request from "supertest";
import { connect, disconnect, clearCollections } from "./helpers/db.js";
import { createAdmin, createUser, tokenFor } from "./helpers/auth.js";
import createApp from "./helpers/testApp.js";
import categoryModel from "../models/categoryModel.js";
import { createProduct } from "./helpers/seed.js";

const app = createApp();

let adminToken;
let userToken;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearCollections();
  const admin = await createAdmin();
  const user = await createUser();
  adminToken = tokenFor(admin);
  userToken = tokenFor(user);
});

// ─── Create Category ──────────────────────────────────────────────────────────

describe("POST /api/v1/category/create-category", () => {
  it("CAT-INT-01 admin creates a category and it is persisted with a slug", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Electronics" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Electronics");
    expect(res.body.category.slug).toBe("electronics");

    const inDb = await categoryModel.findOne({ name: "Electronics" });
    expect(inDb).not.toBeNull();
    expect(inDb.slug).toBe("electronics");
  });

  it("CAT-INT-02 creating a duplicate category name returns already-exists message without creating a duplicate", async () => {
    await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Electronics" });

    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "Electronics" });

    // Controller returns success:true with "Category Already Exists" (source behaviour)
    expect(res.body.message).toMatch(/already exists/i);
    // No new record is created — count must remain 1
    const count = await categoryModel.countDocuments({ name: "Electronics" });
    expect(count).toBe(1);
  });

  it("CAT-INT-03 non-admin user gets 401", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", userToken)
      .send({ name: "Electronics" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("CAT-INT-03b returns 401 when no token is provided (bug fixed)", async () => {
    jest.spyOn(console, "log").mockImplementation(() => { }); // Suppress expected log
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .send({ name: "No Auth Category" });
    expect(res.status).toBe(401);
  });
});

// ─── Get All Categories ───────────────────────────────────────────────────────

describe("GET /api/v1/category/get-category", () => {
  it("CAT-INT-04 returns all seeded categories", async () => {
    await categoryModel.create({ name: "Books", slug: "books" });
    await categoryModel.create({ name: "Clothing", slug: "clothing" });

    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.category.map((c) => c.name);
    expect(names).toContain("Books");
    expect(names).toContain("Clothing");
  });

  it("CAT-INT-04 returns empty array when no categories exist", async () => {
    const res = await request(app).get("/api/v1/category/get-category");

    expect(res.status).toBe(200);
    expect(res.body.category).toHaveLength(0);
  });
});

// ─── Single Category ──────────────────────────────────────────────────────────

describe("GET /api/v1/category/single-category/:slug", () => {
  it("CAT-INT-05 returns the correct category by slug", async () => {
    await categoryModel.create({ name: "Furniture", slug: "furniture" });

    const res = await request(app).get(
      "/api/v1/category/single-category/furniture"
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Furniture");
    expect(res.body.category.slug).toBe("furniture");
  });

  it("CAT-INT-06 returns null category body for an unknown slug", async () => {
    const res = await request(app).get(
      "/api/v1/category/single-category/no-such-category"
    );

    // Controller always responds 200; category field is null when not found
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category).toBeNull();
  });
});

// ─── Update Category ──────────────────────────────────────────────────────────

describe("PUT /api/v1/category/update-category/:id", () => {
  it("CAT-INT-07 admin updates category name and slug", async () => {
    const cat = await categoryModel.create({ name: "Gizmos", slug: "gizmos" });

    const res = await request(app)
      .put(`/api/v1/category/update-category/${cat._id}`)
      .set("Authorization", adminToken)
      .send({ name: "Gadgets" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe("Gadgets");
    expect(res.body.category.slug).toBe("gadgets");

    const inDb = await categoryModel.findById(cat._id);
    expect(inDb.name).toBe("Gadgets");
    expect(inDb.slug).toBe("gadgets");
  });

  it("CAT-INT-08 non-admin gets 401", async () => {
    const cat = await categoryModel.create({ name: "Gizmos", slug: "gizmos" });

    const res = await request(app)
      .put(`/api/v1/category/update-category/${cat._id}`)
      .set("Authorization", userToken)
      .send({ name: "Gadgets" });

    expect(res.status).toBe(401);
  });

  it("CAT-INT-08b returns 401 when no token is provided (bug fixed)", async () => {
    const cat = await categoryModel.create({ name: "NoToken", slug: "notoken" });
    const res = await request(app)
      .put(`/api/v1/category/update-category/${cat._id}`)
      .send({ name: "Hacked" });
    expect(res.status).toBe(401);
  });
});

// ─── Delete Category ──────────────────────────────────────────────────────────

describe("DELETE /api/v1/category/delete-category/:id", () => {
  it("CAT-INT-09 admin deletes a category and it is removed from DB", async () => {
    const cat = await categoryModel.create({ name: "Toys", slug: "toys" });

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${cat._id}`)
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const inDb = await categoryModel.findById(cat._id);
    expect(inDb).toBeNull();
  });

  it("CAT-INT-11-baseline countDocuments returns the correct product count for a category", async () => {
    const cat = await categoryModel.create({ name: "Tools", slug: "tools" });
    await createProduct(cat._id, { name: "Hammer" });
    await createProduct(cat._id, { name: "Screwdriver" });

    const { default: productModel } = await import("../models/productModel.js");
    const count = await productModel.countDocuments({ category: cat._id });
    expect(count).toBe(2);
  });

  it("CAT-INT-11 admin cannot delete a category that has associated products", async () => {
    const cat = await categoryModel.create({ name: "Electronics", slug: "electronics" });
    await createProduct(cat._id, { name: "Laptop" });

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${cat._id}`)
      .set("Authorization", adminToken);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete category with existing products/i);
  });

  it("CAT-INT-10 non-admin gets 401 and category is not deleted", async () => {
    const cat = await categoryModel.create({ name: "Toys", slug: "toys" });

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${cat._id}`)
      .set("Authorization", userToken);

    expect(res.status).toBe(401);

    const inDb = await categoryModel.findById(cat._id);
    expect(inDb).not.toBeNull();
  });

  it("CAT-INT-10b returns 401 when no token is provided (bug fixed)", async () => {
    const cat = await categoryModel.create({ name: "Noauth", slug: "noauth" });
    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${cat._id}`);
    expect(res.status).toBe(401);
    // Category must still be in DB
    const inDb = await categoryModel.findById(cat._id);
    expect(inDb).not.toBeNull();
  });
});
