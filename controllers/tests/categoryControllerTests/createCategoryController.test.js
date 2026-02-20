import {createCategoryController} from "../../categoryController";
import categoryModel from "../../../models/categoryModel";

// 1) mock slugify，让它可预测
jest.mock("slugify", () => jest.fn((s) => `slug-${s}`));

// 2) mock categoryModel：既要 mock 静态方法 findOne，又要 mock 构造 + save
jest.mock("../../../models/categoryModel", () => {
    const ctor = jest.fn();           // 用来 mock new categoryModel(...)
    ctor.findOne = jest.fn();         // 用来 mock categoryModel.findOne(...)
    return ctor;
});

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

describe("createCategoryController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns 401 when name is missing", async () => {
        const req = { body: {} };
        const res = mockRes();

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });

        expect(categoryModel.findOne).not.toHaveBeenCalled();
        expect(categoryModel).not.toHaveBeenCalled(); // 没有 new categoryModel(...)
    });

    test("returns 200 when category already exists", async () => {
        const req = { body: { name: "Electronics" } };
        const res = mockRes();

        categoryModel.findOne.mockResolvedValueOnce({ _id: "c1", name: "Electronics" });

        await createCategoryController(req, res);

        expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Category Already Exists",
            })
        );

        expect(categoryModel).not.toHaveBeenCalled(); // 不应创建新 category
    });

    test("creates a new category and returns 201", async () => {
        const req = { body: { name: "Electronics" } };
        const res = mockRes();

        categoryModel.findOne.mockResolvedValueOnce(null);

        const savedDoc = { _id: "new1", name: "Electronics", slug: "slug-Electronics" };
        const saveMock = jest.fn().mockResolvedValueOnce(savedDoc);

        // mock new categoryModel({...}).save()
        categoryModel.mockImplementationOnce(function (doc) {
            this.save = saveMock;
            this.doc = doc;
            return this;
        });

        await createCategoryController(req, res);

        expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });

        // 确认构造时传的 doc 合理（含 slug）
        expect(categoryModel).toHaveBeenCalledWith({
            name: "Electronics",
            slug: "slug-Electronics",
        });

        expect(saveMock).toHaveBeenCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "New category created",
                category: savedDoc,
            })
        );
    });

    test("returns 500 when db throws (and reveals bug in catch)", async () => {
        // buggy at first
        const req = { body: { name: "Electronics" } };
        const res = mockRes();

        categoryModel.findOne.mockRejectedValueOnce(new Error("DB down"));

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error in Category",
            })
        );
    });
});
