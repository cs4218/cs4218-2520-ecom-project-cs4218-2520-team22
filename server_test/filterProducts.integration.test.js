import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import { productFiltersController } from "../controllers/productController.js";
import { jest } from "@jest/globals";

const filterProductsPath = "/api/v1/product/product-filters";

let mongoServer, firstCategory, secondCategory;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    firstCategory = await categoryModel.create({ name: "Books", slug: "books" });
    secondCategory = await categoryModel.create({ name: "Electronics", slug: "electronics" });
});

afterEach(async () => {
    await productModel.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

it("Product model creates and retrieves successfully", async () => {
    const product = await productModel.create({
        name: "Books",
        slug: "books",
        description: "A product for testing",
        price: 99.99,
        category: firstCategory._id,
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });

    const products = await productModel.find({});

    expect(products.length).toBe(1);
    expect(products[0]._id.equals(product._id)).toBe(true);
});


it("productFiltersController filters products successfully", async () => {
    await productModel.create({
        name: "Books",
        slug: "books",
        description: "A product for testing",
        price: 99.99,
        category: firstCategory._id,
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });
    await productModel.create({
        name: "Television",
        slug: "Television",
        description: "A product for testing",
        price: 99.99,
        category: secondCategory._id,
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });
    const product = await productModel.create({
        name: "Phone",
        slug: "Phone",
        description: "A product for testing",
        price: 50,
        category: secondCategory._id,
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });

    const req = {
        body: {
            checked: [secondCategory._id],
            radio: [40, 60]
        }
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
    };

    await productFiltersController(req, res);

    const responseData = res.send.mock.calls[0][0];
    expect(res.status).toBeCalledWith(200);
    expect(responseData.success).toBe(true);
    expect(responseData.products.length).toBe(1);
    expect(responseData.products[0]._id.equals(product._id)).toBe(true);
});

it("Calling API filters products successfully", async () => {
    await productModel.create({
        name: "Books",
        slug: "books",
        description: "A product for testing",
        price: 99.99,
        category: firstCategory._id,
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });
    await productModel.create({
        name: "Television",
        slug: "Television",
        description: "A product for testing",
        price: 99.99,
        category: secondCategory._id,
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });
    const product = await productModel.create({
        name: "Phone",
        slug: "Phone",
        description: "A product for testing",
        price: 50,
        category: secondCategory._id,
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });

    const response = await request(app).post(filterProductsPath).send({ checked: [secondCategory._id], radio: [40, 60] }).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0]._id).toBe(product._id.toString());
});
