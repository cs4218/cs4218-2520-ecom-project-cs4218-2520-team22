/**
 * Sprint 2 — Order Integration Tests
 * Covers: Order creation (mocked Braintree), user orders, admin orders, order status update
 * Approach: Bottom-up integration (real DB via MongoMemoryServer, real HTTP via supertest,
 *           Braintree gateway mocked at the module level)
 *
 * QINZHE Wang, A0337880U
 */

import request from "supertest";
import { jest } from "@jest/globals";
import { connect, disconnect, clearCollections } from "./helpers/db.js";
import { createAdmin, createUser, tokenFor } from "./helpers/auth.js";
import { createCategory, createProduct, createOrder } from "./helpers/seed.js";
import createApp from "./helpers/testApp.js";
import orderModel from "../models/orderModel.js";

// ---------------------------------------------------------------------------
// Mock the braintree module so that gateway.transaction.sale() behaves
// predictably in tests without a real Braintree sandbox account.
// ---------------------------------------------------------------------------
jest.mock("braintree", () => {
  const mockSale = jest.fn((opts, callback) => {
    callback(null, { success: true, transaction: { id: "fake-txn-001" } });
  });
  return {
    BraintreeGateway: jest.fn(() => ({
      clientToken: {
        generate: jest.fn((_, cb) => cb(null, { clientToken: "fake-token" })),
      },
      transaction: { sale: mockSale },
    })),
    Environment: { Sandbox: "sandbox" },
  };
});

let app;
let adminUser;
let regularUser;
let adminToken;
let userToken;
let testCategory;
let testProduct;

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
  testCategory = await createCategory({ name: "Gadgets" });
  testProduct = await createProduct(testCategory._id, { name: "Smart Watch", price: 199 });
});

// ---------------------------------------------------------------------------
// Story 2.4 — Order Creation & Retrieval Integration
// ---------------------------------------------------------------------------
describe("Story 2.4 — Order Integration", () => {

  // ORD-INT-01
  test("ORD-INT-01: Create order with valid user token — order persisted in DB with buyer ref", async () => {
    // Mark Wang, A0337880U
    const res = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", userToken)
      .send({
        nonce: "fake-nonce",
        cart: [{ _id: testProduct._id, name: testProduct.name, price: 199 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Allow async save inside Braintree callback to complete
    await new Promise((r) => setTimeout(r, 100));

    const orders = await orderModel.find({ buyer: regularUser._id });
    expect(orders.length).toBe(1);
    expect(orders[0].buyer.toString()).toBe(regularUser._id.toString());
  });

  // ORD-INT-02
  // Bug fixed: requireSignIn now returns 401 when no token is provided.
  test("ORD-INT-02: Create order without auth token returns 401", async () => {
    // Mark Wang, A0337880U
    const ordersBefore = await orderModel.countDocuments();

    const res = await request(app)
      .post("/api/v1/product/braintree/payment")
      // No Authorization header
      .send({ nonce: "fake", cart: [{ price: 10 }] });

    expect(res.status).toBe(401);

    // No order should have been created
    const ordersAfter = await orderModel.countDocuments();
    expect(ordersAfter).toBe(ordersBefore);
  });

  // ORD-INT-03
  test("ORD-INT-03: Get user orders returns orders for the authenticated user only", async () => {
    // Mark Wang, A0337880U
    // Create an order for regularUser and another for adminUser
    await createOrder(regularUser._id, [testProduct._id]);
    await createOrder(adminUser._id, [testProduct._id]);

    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", userToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].buyer.name).toBe(regularUser.name);
  });

  // ORD-INT-04
  test("ORD-INT-04: User orders include populated product data (not just IDs)", async () => {
    // Mark Wang, A0337880U
    await createOrder(regularUser._id, [testProduct._id]);

    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", userToken);

    expect(res.status).toBe(200);
    const order = res.body[0];
    expect(Array.isArray(order.products)).toBe(true);
    expect(order.products.length).toBeGreaterThan(0);
    // Products should be populated objects, not raw ObjectId strings
    const product = order.products[0];
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("price");
    // photo field should be excluded per getOrdersController's populate("-photo")
    expect(product).not.toHaveProperty("photo");
  });

  // ORD-INT-05
  test("ORD-INT-05: Admin get all orders returns all orders from all users", async () => {
    // Mark Wang, A0337880U
    await createOrder(regularUser._id, [testProduct._id]);
    await createOrder(adminUser._id, [testProduct._id]);

    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  // ORD-INT-06
  test("ORD-INT-06: Admin all-orders with non-admin token returns 401", async () => {
    // Mark Wang, A0337880U
    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", userToken);

    expect(res.status).toBe(401);
  });

  // ORD-INT-07
  test("ORD-INT-07: Admin update order status changes status field in DB", async () => {
    // Mark Wang, A0337880U
    const order = await createOrder(regularUser._id, [testProduct._id]);

    const res = await request(app)
      .put(`/api/v1/auth/order-status/${order._id}`)
      .set("Authorization", adminToken)
      .send({ status: "Processing" });

    expect(res.status).toBe(200);

    const updated = await orderModel.findById(order._id);
    expect(updated.status).toBe("Processing");
  });

  // ORD-INT-08
  // Bug fixed: orderStatusController now uses { runValidators: true }.
  // Mongoose enum validation rejects invalid status values on update.
  test("ORD-INT-08: Update order status with invalid status returns 500 and DB is unchanged", async () => {
    // Mark Wang, A0337880U
    const order = await createOrder(regularUser._id, [testProduct._id]);

    jest.spyOn(console, "log").mockImplementation(() => { }); // suppress expected error
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${order._id}`)
      .set("Authorization", adminToken)
      .send({ status: "InvalidStatus" });
    
        // With runValidators: true, Mongoose rejects the invalid enum value
    expect(res.status).toBe(500);

    // Status in DB must remain unchanged
    const inDb = await orderModel.findById(order._id);
    expect(inDb.status).toBe("Not Processed");
  });
});
