// MANSOOR Syed Ali A0337939J

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Product from "./productModel.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Product.deleteMany({});
});

describe("Product Model", () => {
  const validProductData = {
    name: "Test Product",
    slug: "test-product",
    description: "A product for testing",
    price: 99.99,
    category: new mongoose.Types.ObjectId(),
    quantity: 10,
    shipping: true,
    photo: {
      data: Buffer.from("test"),
      contentType: "image/png",
    },
  };

  it("should create and save a product successfully", async () => {
    // Arrange
    const product = new Product(validProductData);

    // Act
    const savedProduct = await product.save();

    // Assert
    expect(savedProduct._id).toBeDefined();
    expect(savedProduct.name).toBe(validProductData.name);
    expect(savedProduct.slug).toBe(validProductData.slug);
    expect(savedProduct.description).toBe(validProductData.description);
    expect(savedProduct.price).toBe(validProductData.price);
    expect(savedProduct.category.toString()).toBe(
      validProductData.category.toString(),
    );
    expect(savedProduct.quantity).toBe(validProductData.quantity);
    expect(savedProduct.shipping).toBe(validProductData.shipping);
    expect(savedProduct.photo.data.toString()).toEqual(
      validProductData.photo.data.toString(),
    );
    expect(savedProduct.photo.contentType).toBe(
      validProductData.photo.contentType,
    );
    expect(savedProduct.createdAt).toBeDefined();
    expect(savedProduct.updatedAt).toBeDefined();
  });

  it("should fail to save if required fields are missing", async () => {
    // Arrange
    const product = new Product({});

    // Act & Assert
    let err;
    try {
      await product.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.slug).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.price).toBeDefined();
    expect(err.errors.category).toBeDefined();
    expect(err.errors.quantity).toBeDefined();
  });

  it("should fail to save if price is not a number", async () => {
    // Arrange
    const product = new Product({ ...validProductData, price: "not-a-number" });

    // Act & Assert
    await expect(product.save()).rejects.toThrow();
  });

  it("should fail to save if category is not an ObjectId", async () => {
    // Arrange
    const product = new Product({
      ...validProductData,
      category: "not-an-objectid",
    });

    // Act & Assert
    await expect(product.save()).rejects.toThrow();
  });

  it("should save with shipping as undefined (optional field)", async () => {
    // Arrange
    const { shipping, ...dataWithoutShipping } = validProductData;
    const product = new Product(dataWithoutShipping);

    // Act
    const savedProduct = await product.save();

    // Assert
    expect(savedProduct.shipping).toBeUndefined();
  });

  it("should save with photo as empty object (optional field)", async () => {
    // Arrange
    const { photo, ...dataWithoutPhoto } = validProductData;
    const product = new Product(dataWithoutPhoto);

    // Act
    const savedProduct = await product.save();

    // Assert
    expect(savedProduct.photo).toEqual({});
  });

  it("should save with quantity as 0 (edge case)", async () => {
    // Arrange
    const product = new Product({ ...validProductData, quantity: 0 });

    // Act
    const savedProduct = await product.save();

    // Assert
    expect(savedProduct.quantity).toBe(0);
  });

  it("should save with price as 0 (edge case)", async () => {
    // Arrange
    const product = new Product({ ...validProductData, price: 0 });

    // Act
    const savedProduct = await product.save();

    // Assert
    expect(savedProduct.price).toBe(0);
  });

  it("should not save with empty string fields (edge case)", async () => {
    // Arrange
    const product = new Product({
      ...validProductData,
      name: "",
      slug: "",
      description: "",
    });

    // Act & Assert
    await expect(product.save()).rejects.toThrow();
  });

  it("should save with very large price and quantity (max values)", async () => {
    // Arrange
    const product = new Product({
      ...validProductData,
      price: Number.MAX_SAFE_INTEGER,
      quantity: Number.MAX_SAFE_INTEGER,
    });

    // Act
    const savedProduct = await product.save();

    // Assert
    expect(savedProduct.price).toBe(Number.MAX_SAFE_INTEGER);
    expect(savedProduct.quantity).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("should save with null for optional fields (photo, shipping)", async () => {
    // Arrange
    const product = new Product({
      ...validProductData,
      photo: null,
      shipping: null,
    });

    // Act
    const savedProduct = (await product.save()).toObject();

    // Assert
    expect(savedProduct.photo).toBeNull();
    expect(savedProduct.shipping).toBeNull();
  });

  it("should update timestamps on save", async () => {
    // Arrange
    const product = new Product(validProductData);
    await product.save();
    const originalUpdatedAt = product.updatedAt;

    // Act
    product.name = "Updated Name";
    await product.save();

    // Assert
    expect(product.updatedAt > originalUpdatedAt).toBe(true);
  });
});
