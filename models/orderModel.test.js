// Song Yichao, A0255686M

import mongoose from "mongoose";
import orderModel from "./orderModel.js";

describe("Order Model Unit Tests", () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  // add test case, Song Yichao, A0255686M
  it("should default status to 'Not Processed' when not provided", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    expect(order.status).toBe("Not Processed");
  });

  // add test case, Song Yichao, A0255686M
  it("should reject empty products array (at least one product is required)", () => {
    const order = new orderModel({
      products: [],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
    });

    const error = order.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.products).toBeDefined();
    expect(error.errors.products.message).toBe("At least one product is required");
  });

  // add test case, Song Yichao, A0255686M
  it("should require buyer field", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
    });

    const error = order.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.buyer).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should accept all enum status values", () => {
    const validStatuses = [
      "Not Processed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    for (const status of validStatuses) {
      const order = new orderModel({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
        status,
      });

      const error = order.validateSync();
      expect(error).toBeUndefined();
    }
  });

  // add test case, Song Yichao, A0255686M
  it("should reject invalid status values not in enum", () => {
    const order = new orderModel({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: "cancel",
    });

    const error = order.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should define products as an array of ObjectId with ref 'Products'", () => {
    const productsPath = orderModel.schema.path("products");
    expect(productsPath).toBeDefined();

    // Array element schema type is available via caster
    expect(productsPath.caster).toBeDefined();
    expect(productsPath.caster.instance).toBe("ObjectId");
    expect(productsPath.caster.options.ref).toBe("Products");
  });

  // add test case, Song Yichao, A0255686M
  it("should define buyer as ObjectId with ref 'users'", () => {
    const buyerPath = orderModel.schema.path("buyer");
    expect(buyerPath).toBeDefined();
    expect(buyerPath.instance).toBe("ObjectId");
    expect(buyerPath.options.ref).toBe("users");
  });

  // add test case, Song Yichao, A0255686M
  it("should have timestamps enabled", () => {
    expect(orderModel.schema.options.timestamps).toBe(true);
  });
});
