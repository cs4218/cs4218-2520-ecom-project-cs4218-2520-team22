import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Category from "../models/categoryModel";

let mongo;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
    await mongoose.model("Category").syncIndexes();
})

afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("Category model should", () => {
    it("create a category with valid fields", async () => {
        const category = new Category({
            name: "Test",
            slug: "test"
        });
    
        const saved = await category.save();
    
        expect(saved.name).toBe("Test");
        expect(saved.slug).toBe("test");
    });

    it("lowercases slug before saving", async () => {
        const category = new Category({
            name: "Test",
            slug: "TEST"
        });

        const saved = await category.save();

        expect(saved.slug).toBe("test");
    });

    it("reject saving if name is missing", async () => {
        const category = new Category({
            slug: "test"
        });

        await expect(category.save()).rejects.toThrow(/name/);
    });

    it("reject saving duplicated name", async () => {
        await Category.create({
            name: "Test",
            slug: "test"
        });
        const duplicate = new Category({
            name: "Test",
            slug: "test-2"
        });

        await expect(duplicate.save()).rejects.toThrow(/duplicate key/);
    });
});

