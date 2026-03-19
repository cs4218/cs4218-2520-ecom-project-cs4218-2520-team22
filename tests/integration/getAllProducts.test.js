import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app.js";
import productModel from "../../models/productModel.js";
import { getProductController } from "../../controllers/productController.js";

const getAllProductsPath = "/api/v1/product/get-product";

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
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
        category: new mongoose.Types.ObjectId(),
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


it("getProductController returns all products successfully", async () => {
    const product = await productModel.create({
        name: "Electronics",
        slug: "Electronics",
        description: "A product for testing",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });

    const req = {};
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
    };

    await getProductController(req, res);

    const responseData = res.send.mock.calls[0][0];
    expect(res.status).toBeCalledWith(200);
    expect(responseData.success).toBe(true);
    expect(responseData.products.length).toBe(1);
    expect(responseData.products[0]._id.equals(product._id)).toBe(true);
});

it("Calling API returns all products successfully", async () => {
    const product = await productModel.create({
        name: "Clothing",
        slug: "clothing",
        description: "A product for testing",
        price: 99.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("test"),
          contentType: "image/png",
        },
    });

    const response = await request(app).get(getAllProductsPath).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0]._id).toBe(product._id.toString());
});
