/**
 * Sprint 2 — Security Tests (Non-Functional Requirements)
 * Approach: Black-box attack simulation — real DB via MongoMemoryServer, real HTTP via supertest
 * OWASP Top 10 attack classes covered: A01, A03, A05, A07
 *
 * Qinzhe Wang, A0337880U
 */

import request from "supertest";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";
import { connect, disconnect, clearCollections } from "./helpers/db.js";
import { createAdmin, createUser, tokenFor } from "./helpers/auth.js";
import { createCategory, createProduct, createOrder } from "./helpers/seed.js";
import createApp from "./helpers/testApp.js";
import userModel from "../models/userModel.js";

// ── Braintree mock ────────────────────────────────────────────────────────────
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn(() => ({
    clientToken: {
      generate: jest.fn((_, cb) => cb(null, { clientToken: "fake-token" })),
    },
    transaction: {
      sale: jest.fn((_, cb) =>
        cb(null, { success: true, transaction: { id: "txn_test_1" } })
      ),
    },
  })),
  Environment: { Sandbox: "sandbox" },
}));

let app;

beforeAll(async () => {
  await connect();
  app = createApp();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearCollections();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sign a JWT with an arbitrary payload using the test secret. */
const signRaw = (payload, opts = {}) =>
  JWT.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h", ...opts });

/** Craft a JWT with alg:none (unsigned). */
const noneToken = (payload) => {
  const hdr = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url"
  );
  const pld = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${hdr}.${pld}.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Story 1 — JWT Authentication Boundary Tests (OWASP A07)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Story 1 — JWT Authentication Boundary Tests", () => {
  // SEC-JWT-01
  // Qinzhe Wang, A0337880U
  it("SEC-JWT-01: No Authorization header → 401", async () => {
    const res = await request(app).get("/api/v1/auth/user-auth");
    expect(res.status).toBe(401);
  });

  // SEC-JWT-02
  // Qinzhe Wang, A0337880U
  it("SEC-JWT-02: Empty string Authorization → 401", async () => {
    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", "");
    expect(res.status).toBe(401);
  });

  // SEC-JWT-03
  // Qinzhe Wang, A0337880U
  it("SEC-JWT-03: Token signed with wrong secret → 401", async () => {
    const token = JWT.sign({ _id: "fakeid" }, "wrong-secret");
    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", token);
    expect(res.status).toBe(401);
  });

  // SEC-JWT-04
  // Qinzhe Wang, A0337880U
  it("SEC-JWT-04: alg:none unsigned token → 401", async () => {
    const token = noneToken({ _id: "fakeid", role: 1 });
    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", token);
    expect(res.status).toBe(401);
  });

  // SEC-JWT-05
  // Qinzhe Wang, A0337880U
  it("SEC-JWT-05: Expired token → 401", async () => {
    // Explicitly set exp 1 hour in the past
    const token = JWT.sign(
      { _id: "fakeid", exp: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_SECRET
    );
    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", token);
    expect(res.status).toBe(401);
  });

  // SEC-JWT-06
  // Qinzhe Wang, A0337880U
  it("SEC-JWT-06: Token whose user ID no longer exists in DB → admin endpoint 401", async () => {
    const ghostId = new mongoose.Types.ObjectId();
    const token = signRaw({ _id: ghostId });
    // isAdmin will find no user → 401
    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", token);
    expect(res.status).toBe(401);
  });

  // SEC-JWT-07
  // Qinzhe Wang, A0337880U
  it("SEC-JWT-07: Token with role:1 payload but DB role:0 → admin endpoint 401", async () => {
    const user = await createUser({ role: 0 });
    // Inject role:1 into the JWT — isAdmin must re-query DB, not trust payload
    const token = JWT.sign(
      { _id: user._id, role: 1 },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", token);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Story 2 — Privilege Escalation / Broken Access Control (OWASP A01)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Story 2 — Privilege Escalation / Broken Access Control", () => {
  let userToken;
  let testCategory;

  beforeEach(async () => {
    const user = await createUser();
    userToken = tokenFor(user);
    testCategory = await createCategory({ name: "Electronics" });
  });

  // SEC-AC-01
  // Qinzhe Wang, A0337880U
  it("SEC-AC-01: Regular user cannot create category → 401", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", userToken)
      .send({ name: "Hacked Category" });
    expect(res.status).toBe(401);
  });

  // SEC-AC-02
  // Qinzhe Wang, A0337880U
  it("SEC-AC-02: Regular user cannot update category → 401", async () => {
    const res = await request(app)
      .put(`/api/v1/category/update-category/${testCategory._id}`)
      .set("Authorization", userToken)
      .send({ name: "Hacked Name" });
    expect(res.status).toBe(401);
  });

  // SEC-AC-03
  // Qinzhe Wang, A0337880U
  it("SEC-AC-03: Regular user cannot delete category → 401", async () => {
    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${testCategory._id}`)
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });

  // SEC-AC-04
  // Qinzhe Wang, A0337880U
  it("SEC-AC-04: Regular user cannot create product → 401", async () => {
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", userToken)
      .field("name", "Hacked Product")
      .field("description", "desc")
      .field("price", "1")
      .field("category", testCategory._id.toString())
      .field("quantity", "1");
    expect(res.status).toBe(401);
  });

  // SEC-AC-05
  // Qinzhe Wang, A0337880U
  it("SEC-AC-05: Regular user cannot update product → 401", async () => {
    const admin = await createAdmin();
    const adminToken = tokenFor(admin);
    const product = await createProduct(testCategory._id);
    const res = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("Authorization", userToken)
      .field("name", "Hacked");
    expect(res.status).toBe(401);
  });

  // SEC-AC-06
  // Qinzhe Wang, A0337880U
  it("SEC-AC-06: Regular user cannot delete product → 401", async () => {
    const product = await createProduct(testCategory._id);
    const res = await request(app)
      .delete(`/api/v1/product/delete-product/${product._id}`)
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });

  // SEC-AC-07
  // Qinzhe Wang, A0337880U
  it("SEC-AC-07: Regular user cannot access all-orders → 401", async () => {
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", userToken);
    expect(res.status).toBe(401);
  });

  // SEC-AC-08
  // Qinzhe Wang, A0337880U
  it("SEC-AC-08: Regular user cannot update order status → 401", async () => {
    const fakeOrderId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${fakeOrderId}`)
      .set("Authorization", userToken)
      .send({ status: "Shipped" });
    expect(res.status).toBe(401);
  });

  // SEC-AC-09
  // Qinzhe Wang, A0337880U
  it("SEC-AC-09: Unauthenticated request to admin-only route → 401", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .send({ name: "No Auth" });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Story 3 — Insecure Direct Object Reference / IDOR (OWASP A01)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Story 3 — IDOR", () => {
  // SEC-IDOR-01
  // Qinzhe Wang, A0337880U
  it("SEC-IDOR-01: GET /auth/orders only returns orders for the authenticated user", async () => {
    const userA = await createUser({ email: "a@test.com" });
    const userB = await createUser({ email: "b@test.com" });
    const cat = await createCategory();
    const product = await createProduct(cat._id);

    // Create one order per user
    await createOrder(userA._id, [product._id], { status: "Not Processed" });
    await createOrder(userB._id, [product._id], { status: "Shipped" });

    const tokenA = tokenFor(userA);
    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", tokenA);

    expect(res.status).toBe(200);
    // All returned orders must belong to User A
    const orders = res.body;
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(1);
    orders.forEach((o) => {
      expect(o.buyer._id.toString()).toBe(userA._id.toString());
    });
  });

  // SEC-IDOR-02
  // Qinzhe Wang, A0337880U
  it("SEC-IDOR-02: GET /product/product-photo/:pid is public and accessible without auth", async () => {
    const cat = await createCategory();
    const product = await createProduct(cat._id);
    // No photo data — controller will send empty/404 but must not crash with auth error
    const res = await request(app).get(
      `/api/v1/product/product-photo/${product._id}`
    );
    // Expect a non-401 response (public endpoint)
    expect(res.status).not.toBe(401);
  });

  // SEC-IDOR-03
  // Qinzhe Wang, A0337880U
  it("SEC-IDOR-03: PUT /auth/profile ignores _id in body and updates only the authenticated user", async () => {
    const userA = await createUser({ email: "a@test.com", name: "Alice" });
    const userB = await createUser({ email: "b@test.com", name: "Bob" });
    const tokenA = tokenFor(userA);

    // Attempt to inject User B's _id in the request body
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", tokenA)
      .send({ _id: userB._id, name: "Hacked Bob" });

    expect(res.status).toBe(200);
    // The update must have applied to User A, not User B
    const updatedA = await userModel.findById(userA._id);
    const updatedB = await userModel.findById(userB._id);
    expect(updatedA.name).toBe("Hacked Bob"); // Name changed on A
    expect(updatedB.name).toBe("Bob"); // B untouched
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Story 4 — Input Validation & NoSQL Injection (OWASP A03)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Story 4 — Input Validation & NoSQL Injection", () => {
  // SEC-INJ-01
  // Qinzhe Wang, A0337880U
  it("SEC-INJ-01: Login with {$gt:''} operator as email → 400/404, no user data returned", async () => {
    // Pre-seed a user so there is something to match if injection succeeds
    await createUser({ email: "victim@test.com" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: { $gt: "" }, password: "anything" });

    // Must not return 200 with a token
    expect(res.status).not.toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user).toBeUndefined();
  });

  // SEC-INJ-02
  // Qinzhe Wang, A0337880U
  it("SEC-INJ-02: Forgot-password with {$gt:''} as email → 400/404, no reset", async () => {
    const user = await createUser({ email: "victim@test.com", answer: "blue" });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: { $gt: "" }, answer: "blue", newPassword: "newpass123" });

    expect([400, 404]).toContain(res.status);
    // Verify the password was NOT changed
    const fresh = await userModel.findById(user._id);
    // Password should still match original (bcrypt comparison done externally)
    expect(fresh.password).toBe(user.password);
  });

  // SEC-INJ-03
  // Qinzhe Wang, A0337880U
  it("SEC-INJ-03: Search with regex keyword returns results without crash", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "alpha item", description: "test" });

    const res = await request(app).get("/api/v1/product/search/a.*");
    expect([200, 400]).toContain(res.status);
    // Must not return 500 (no unhandled crash)
    expect(res.status).not.toBe(500);
  });

  // SEC-INJ-04
  // Qinzhe Wang, A0337880U
  it("SEC-INJ-04: Product-filters with $where object as checked → handled safely", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: { $where: "sleep(1000)" }, radio: [] });

    // Must not crash with a 500
    expect(res.status).not.toBe(500);
  });

  // SEC-INJ-05
  // Qinzhe Wang, A0337880U
  it("SEC-INJ-05: Register with extremely long name (10 000 chars) → 400 or truncation, no crash", async () => {
    const longName = "A".repeat(10000);
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: longName,
        email: "long@test.com",
        password: "password123",
        phone: "1234567890",
        address: "123 Main St",
        answer: "blue",
      });

    // Must not return 500
    expect(res.status).not.toBe(500);
  });

  // SEC-INJ-06
  // Qinzhe Wang, A0337880U
  it("SEC-INJ-06: Category name containing XSS payload stored as raw string, API returns 201", async () => {
    const admin = await createAdmin();
    const adminToken = tokenFor(admin);
    const xssPayload = "<script>alert(1)</script>";

    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({ name: xssPayload });

    expect(res.status).toBe(201);
    // The raw string is stored — not executed server-side
    expect(res.body.category.name).toBe(xssPayload);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Story 5 — User Enumeration via Login Error Messages (OWASP A05)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Story 5 — User Enumeration via Login Error Messages", () => {
  // SEC-ENUM-01
  // Qinzhe Wang, A0337880U
  it("SEC-ENUM-01: Login with unregistered email returns generic message", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@test.com", password: "anypassword" });

    expect(res.status).toBe(401);
    // Must NOT reveal whether the email exists
    expect(res.body.message).not.toMatch(/not registered/i);
    expect(res.body.message).not.toMatch(/email.*found/i);
  });

  // SEC-ENUM-02
  // Qinzhe Wang, A0337880U
  it("SEC-ENUM-02: Login with registered email + wrong password returns same generic message", async () => {
    await createUser({ email: "real@test.com" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "real@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).not.toMatch(/invalid password/i);
    expect(res.body.message).not.toMatch(/password.*wrong/i);
  });

  // SEC-ENUM-03
  // Qinzhe Wang, A0337880U
  it("SEC-ENUM-03: Both enumeration cases return the same HTTP status code (401)", async () => {
    await createUser({ email: "real@test.com" });

    const [unregistered, wrongPassword] = await Promise.all([
      request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nobody@test.com", password: "x" }),
      request(app)
        .post("/api/v1/auth/login")
        .send({ email: "real@test.com", password: "wrongpassword" }),
    ]);

    expect(unregistered.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    // The messages should also match to prevent timing / content analysis
    expect(unregistered.body.message).toBe(wrongPassword.body.message);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Story 6 — Password Reset Security (OWASP A07)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Story 6 — Password Reset Security", () => {
  // SEC-RESET-01
  // Qinzhe Wang, A0337880U
  it("SEC-RESET-01: Correct email + correct answer resets password successfully", async () => {
    await createUser({ email: "user@test.com", answer: "blue" });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "user@test.com", answer: "blue", newPassword: "newpass123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // SEC-RESET-02
  // Qinzhe Wang, A0337880U
  it("SEC-RESET-02: Correct email + wrong answer → 404, password unchanged", async () => {
    const user = await createUser({ email: "user@test.com", answer: "blue" });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "user@test.com", answer: "red", newPassword: "newpass123" });

    expect(res.status).toBe(404);
    const fresh = await userModel.findById(user._id);
    expect(fresh.password).toBe(user.password);
  });

  // SEC-RESET-03
  // Qinzhe Wang, A0337880U
  it("SEC-RESET-03: Wrong email + correct answer → 404, no change", async () => {
    const user = await createUser({ email: "user@test.com", answer: "blue" });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "wrong@test.com", answer: "blue", newPassword: "newpass123" });

    expect(res.status).toBe(404);
    const fresh = await userModel.findById(user._id);
    expect(fresh.password).toBe(user.password);
  });

  // SEC-RESET-04
  // Qinzhe Wang, A0337880U
  it("SEC-RESET-04: Registration response does not expose the answer field", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "newuser@test.com",
        password: "password123",
        phone: "1234567890",
        address: "123 Main St",
        answer: "mysecretanswer",
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    // Security answer must NOT be present in the response
    expect(res.body.user.answer).toBeUndefined();
  });

  // SEC-RESET-05
  // Qinzhe Wang, A0337880U
  it("SEC-RESET-05: Login response does not expose the answer field", async () => {
    await createUser({ email: "user@test.com" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.answer).toBeUndefined();
    // Also confirm the JWT payload does not contain the answer
    if (res.body.token) {
      const decoded = JWT.decode(res.body.token);
      expect(decoded.answer).toBeUndefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Story 7 — Unauthenticated Access to Payment Token Endpoint (OWASP A05)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Story 7 — Unauthenticated Access to Payment Token Endpoint", () => {
  // SEC-PAY-01
  // Qinzhe Wang, A0337880U
  it("SEC-PAY-01: Unauthenticated GET /braintree/token → 401 (protected after fix)", async () => {
    const res = await request(app).get("/api/v1/product/braintree/token");
    expect(res.status).toBe(401);
  });

  // SEC-PAY-02
  // Qinzhe Wang, A0337880U
  it("SEC-PAY-02: Authenticated user GET /braintree/token → 200 with token", async () => {
    const user = await createUser();
    const token = tokenFor(user);

    const res = await request(app)
      .get("/api/v1/product/braintree/token")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.clientToken).toBe("fake-token");
  });

  // SEC-PAY-03
  // Qinzhe Wang, A0337880U
  it("SEC-PAY-03: POST /braintree/payment without auth → 401 (existing protection)", async () => {
    const res = await request(app)
      .post("/api/v1/product/braintree/payment")
      .send({ nonce: "fake-nonce", cart: [] });
    expect(res.status).toBe(401);
  });
});
