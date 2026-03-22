// Lim Jun Xian A0259094U
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import categoryModel from "../models/categoryModel.js";
import { categoryController } from "../controllers/categoryController.js";
import { jest } from "@jest/globals";

const getAllCategoriesPath = "/api/v1/category/get-category";

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
    await categoryModel.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

it("Category model creates and retrieves successfully", async () => {
    const category = await categoryModel.create({ name: "Books", slug: "books" });

    const categories = await categoryModel.find({});

    expect(categories.length).toBe(1);
    expect(categories[0]._id.equals(category._id)).toBe(true);
});


it("Category controller returns all categories successfully", async () => {
    const category = await categoryModel.create({ name: "Electronics", slug: "electronics" });

    const req = {};
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
    };

    await categoryController(req, res);

    const responseData = res.send.mock.calls[0][0];
    expect(res.status).toBeCalledWith(200);
    expect(responseData.success).toBe(true);
    expect(responseData.category.length).toBe(1);
    expect(responseData.category[0]._id.equals(category._id)).toBe(true);
});

it("Calling API returns all categories successfully", async () => {
    const category = await categoryModel.create({ name: "Clothing", slug: "clothing" });

    const response = await request(app).get(getAllCategoriesPath).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(1);
    expect(response.body.category[0]._id).toBe(category._id.toString());
});
