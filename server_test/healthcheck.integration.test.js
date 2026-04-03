// Health check integration tests for all publicly exposed endpoints
// Covers: Public routes, User-protected routes, Admin-protected routes

import request from "supertest";
import { connect, disconnect } from "./helpers/db.js";
import { createUser, createAdmin, tokenFor } from "./helpers/auth.js";
import { createCategory, createProduct, createOrder } from "./helpers/seed.js";
import app from "../app.js";

let adminUser;
let regularUser;
let adminToken;
let userToken;
let testCategory;
let testProduct;
let testOrder;

beforeAll(async () => {
  await connect();
  adminUser = await createAdmin();
  regularUser = await createUser();
  adminToken = tokenFor(adminUser);
  userToken = tokenFor(regularUser);
  testCategory = await createCategory({ name: "Health Check Category" });
  testProduct = await createProduct(testCategory._id, {
    name: "Health Check Product",
  });
  testOrder = await createOrder(regularUser._id, [testProduct._id]);
});

afterAll(async () => {
  await disconnect();
});

// ─── Root endpoint ───────────────────────────────────────────────────────────

describe("GET /", () => {
  it("HC-01 root endpoint is reachable", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });
});

// ─── Auth endpoints ──────────────────────────────────────────────────────────

describe("POST /api/v1/auth/register", () => {
  it("HC-02 register endpoint accepts valid registration data", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Health Check User",
      email: "healthcheck@example.com",
      password: "password123",
      phone: "1234567890",
      address: "123 Health St",
      answer: "healthanswer",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("HC-03 login endpoint returns token for valid credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: regularUser.email,
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
});

describe("POST /api/v1/auth/forgot-password", () => {
  it("HC-04 forgot-password endpoint resets password with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: regularUser.email,
        answer: "testanswer",
        newPassword: "newpassword123",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/auth/user-auth", () => {
  it("HC-05 user-auth endpoint returns ok for authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", userToken);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("HC-05b user-auth endpoint returns 401 without token", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const res = await request(app).get("/api/v1/auth/user-auth");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/admin-auth", () => {
  it("HC-06 admin-auth endpoint returns ok for admin user", async () => {
    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", adminToken);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("HC-06b admin-auth endpoint returns 401 for regular user", async () => {
    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/test", () => {
  it("HC-07 admin test endpoint is reachable by admin", async () => {
    const res = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", adminToken);
    expect(res.status).toBe(200);
  });

  it("HC-07b admin test endpoint returns 401 for regular user", async () => {
    const res = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/v1/auth/profile", () => {
  it("HC-08 profile update endpoint is reachable for authenticated user", async () => {
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userToken)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("HC-08b profile update returns 401 without token", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .send({ name: "Ghost" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/orders", () => {
  it("HC-09 orders endpoint is reachable for authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", userToken);
    expect(res.status).toBe(200);
  });

  it("HC-09b orders endpoint returns 401 without token", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const res = await request(app).get("/api/v1/auth/orders");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/all-orders", () => {
  it("HC-10 all-orders endpoint is reachable for admin", async () => {
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", adminToken);
    expect(res.status).toBe(200);
  });

  it("HC-10b all-orders endpoint returns 401 for regular user", async () => {
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/v1/auth/order-status/:orderId", () => {
  it("HC-11 order-status endpoint is reachable for admin", async () => {
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${testOrder._id}`)
      .set("Authorization", adminToken)
      .send({ status: "Processing" });
    expect(res.status).toBe(200);
  });

  it("HC-11b order-status endpoint returns 401 for regular user", async () => {
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${testOrder._id}`)
      .set("Authorization", userToken)
      .send({ status: "Processing" });
    expect(res.status).toBe(401);
  });
});

// ─── Category endpoints ───────────────────────────────────────────────────────

describe("GET /api/v1/category/get-category", () => {
  it("HC-12 get-category endpoint is publicly accessible", async () => {
    const res = await request(app).get("/api/v1/category/get-category");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/category/single-category/:slug", () => {
  it("HC-13 single-category endpoint is publicly accessible", async () => {
    const res = await request(app).get(
      `/api/v1/category/single-category/${testCategory.slug}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/v1/category/create-category", () => {
  it("HC-14 create-category endpoint is reachable for admin", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: "New Health Category" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("HC-14b create-category returns 401 without token", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .send({ name: "Unauthorized Category" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/v1/category/update-category/:id", () => {
  it("HC-15 update-category endpoint is reachable for admin", async () => {
    const res = await request(app)
      .put(`/api/v1/category/update-category/${testCategory._id}`)
      .set("Authorization", adminToken)
      .send({ name: "Updated Category" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("HC-15b update-category returns 401 for regular user", async () => {
    const res = await request(app)
      .put(`/api/v1/category/update-category/${testCategory._id}`)
      .set("Authorization", userToken)
      .send({ name: "Sneaky Update" });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/v1/category/delete-category/:id", () => {
  it("HC-16 delete-category endpoint is reachable for admin", async () => {
    const categoryToDelete = await createCategory({ name: "Delete Me" });
    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${categoryToDelete._id}`)
      .set("Authorization", adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("HC-16b delete-category returns 401 for regular user", async () => {
    const categoryToDelete = await createCategory({ name: "Cannot Delete" });
    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${categoryToDelete._id}`)
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });
});

// ─── Product endpoints ────────────────────────────────────────────────────────

describe("POST /api/v1/product/create-product", () => {
  it("HC-17 create-product endpoint is reachable for admin", async () => {
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", adminToken)
      .field("name", "HC New Product")
      .field("description", "Health check product")
      .field("price", "10.00")
      .field("category", testCategory._id.toString())
      .field("quantity", "5")
      .field("shipping", "true");
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("HC-17b create-product returns 401 without token", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .field("name", "Unauthorized Product");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/v1/product/update-product/:pid", () => {
  it("HC-18 update-product endpoint is reachable for admin", async () => {
    const res = await request(app)
      .put(`/api/v1/product/update-product/${testProduct._id}`)
      .set("Authorization", adminToken)
      .field("name", "Updated HC Product")
      .field("description", "Updated description")
      .field("price", "20.00")
      .field("category", testCategory._id.toString())
      .field("quantity", "10");
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("HC-18b update-product returns 401 for regular user", async () => {
    const res = await request(app)
      .put(`/api/v1/product/update-product/${testProduct._id}`)
      .set("Authorization", userToken)
      .field("name", "Sneaky Update");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/product/get-product", () => {
  it("HC-19 get-product endpoint is publicly accessible", async () => {
    const res = await request(app).get("/api/v1/product/get-product");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/product/get-product/:slug", () => {
  it("HC-20 get single product by slug is publicly accessible", async () => {
    const res = await request(app).get(
      `/api/v1/product/get-product/${testProduct.slug}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/product/product-photo/:pid", () => {
  it("HC-21 product-photo endpoint responds for a valid product id", async () => {
    const res = await request(app).get(
      `/api/v1/product/product-photo/${testProduct._id}`
    );
    // 200 if a photo is present, 404 if the product has no photo data
    expect([200, 404]).toContain(res.status);
  });
});

describe("DELETE /api/v1/product/delete-product/:pid", () => {
  it("HC-22 delete-product endpoint is reachable for admin", async () => {
    const productToDelete = await createProduct(testCategory._id, {
      name: "Delete Me Product",
    });
    const res = await request(app)
      .delete(`/api/v1/product/delete-product/${productToDelete._id}`)
      .set("Authorization", adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("HC-22b delete-product returns 401 for regular user", async () => {
    const productToProtect = await createProduct(testCategory._id, {
      name: "Protected Product",
    });
    const res = await request(app)
      .delete(`/api/v1/product/delete-product/${productToProtect._id}`)
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/product/product-filters", () => {
  it("HC-23 product-filters endpoint is publicly accessible", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [], radio: [] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/product/product-count", () => {
  it("HC-24 product-count endpoint is publicly accessible", async () => {
    const res = await request(app).get("/api/v1/product/product-count");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/product/product-list/:page", () => {
  it("HC-25 product-list endpoint is publicly accessible", async () => {
    const res = await request(app).get("/api/v1/product/product-list/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/product/search/:keyword", () => {
  it("HC-26 search endpoint is publicly accessible", async () => {
    const res = await request(app).get("/api/v1/product/search/health");
    expect(res.status).toBe(200);
  });
});

describe("GET /api/v1/product/related-product/:pid/:cid", () => {
  it("HC-27 related-product endpoint is publicly accessible", async () => {
    const res = await request(app).get(
      `/api/v1/product/related-product/${testProduct._id}/${testCategory._id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/product/product-category/:slug", () => {
  it("HC-28 product-category endpoint is publicly accessible", async () => {
    const res = await request(app).get(
      `/api/v1/product/product-category/${testCategory.slug}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/product/braintree/token", () => {
  it("HC-29 braintree token endpoint is reachable", async () => {
    const res = await request(app).get("/api/v1/product/braintree/token");
    // Responds with 200 on valid Braintree config, 500 if credentials are absent
    expect([200, 500]).toContain(res.status);
  });
});

describe("POST /api/v1/product/braintree/payment", () => {
  it("HC-30 braintree payment endpoint requires authentication", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const res = await request(app)
      .post("/api/v1/product/braintree/payment")
      .send({ nonce: "fake-nonce", cart: [] });
    expect(res.status).toBe(401);
  });
});
