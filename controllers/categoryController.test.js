// Lim Jun Xian A0259094U
import categoryModel from "../models/categoryModel";
import {
    categoryController,
    createCategoryController,
    deleteCategoryController,
    singleCategoryController,
    updateCategoryController,
} from "./categoryController";


jest.mock("slugify", () => jest.fn((s) => `slug-${s}`));


jest.mock("../models/categoryModel", () => {
    const ctor = jest.fn();
    ctor.findOne = jest.fn();
    ctor.findByIdAndDelete = jest.fn();
    ctor.findByIdAndUpdate = jest.fn();
    return ctor;
});

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}
let consoleSpy;

beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.clearAllMocks();
});

afterEach(() => {
    consoleSpy.mockRestore();
});

describe("categoryController", () => {
    let res
    const req = {}

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    it("fetches all categories successfully", async () => {
        const mockCategoryList = [ {_id: 1, name: "Test", slug: "test" } ];
        const findMock = jest.fn().mockResolvedValueOnce(mockCategoryList);
        categoryModel.find = findMock;

        await categoryController(req, res);

        expect(findMock).toBeCalledTimes(1);
        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith({
            success: true,
            message: "All Categories List",
            category: mockCategoryList
        });
    });

    it("fetches all categories unsuccessfully", async () => {
        const mockError = new Error("Test Error");
        const findMock = jest.fn().mockRejectedValueOnce(mockError);
        categoryModel.find = findMock;

        await categoryController(req, res);

        expect(findMock).toBeCalledTimes(1);
        expect(res.status).toBeCalledWith(500);
        expect(res.send).toBeCalledWith({
            success: false,
            error: mockError,
            message: "Error while getting all categories"
        });
        expect(consoleSpy).toBeCalledWith(mockError);
    });
});

describe("singleCategoryController", () => {
    let res, req

    beforeEach(() => {
        req = {
            params: {
                slug: "test"
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    it("fetches one category successfully", async () => {
        const mockCategoryList = [ {_id: 1, name: "Test", slug: "test" } ];
        const findOneMock = jest.fn().mockResolvedValueOnce(mockCategoryList);
        categoryModel.findOne = findOneMock;

        await singleCategoryController(req, res);

        expect(findOneMock).toBeCalledTimes(1);
        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith({
            success: true,
            message: "Get Single Category Successfully",
            category: mockCategoryList
        });
    });

    describe("fetches one category unsuccessfully when", () => {
        it("category model encounters error while finding", async () => {
            const mockError = new Error("Test Error");
            const findOneMock = jest.fn().mockRejectedValueOnce(mockError);
            categoryModel.findOne = findOneMock;

            await singleCategoryController(req, res);

            expect(findOneMock).toBeCalledTimes(1);
            expect(res.status).toBeCalledWith(500);
            expect(res.send).toBeCalledWith({
                success: false,
                error: mockError,
                message: "Error While getting Single Category"
            });
            expect(consoleSpy).toBeCalledWith(mockError);
        });

        it("slug is undefined", async () => {
            req.params = {}
            const error = new Error("Invalid slug provided");
            const findOneMock = jest.fn();
            categoryModel.findOne = findOneMock;

            await singleCategoryController(req, res);

            expect(findOneMock).toBeCalledTimes(0);
            expect(res.status).toBeCalledWith(500);
            expect(res.send).toBeCalledWith({
                success: false,
                error,
                message: "Error While getting Single Category"
            });
            expect(consoleSpy).toBeCalledWith(error);
        });
    });
});
// Qinzhe Wang A0337880U
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
// Qinzhe Wang A0337880U
describe("deleteCategoryController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("deletes category and returns 200", async () => {
        const req = {
            params: { id: "c1" },
        };
        const res = mockRes();

        categoryModel.findByIdAndDelete.mockResolvedValueOnce({
            _id: "c1",
            name: "Electronics",
        });

        await deleteCategoryController(req, res);

        expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("c1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Category Deleted Successfully",
            })
        );
    });

    test("returns 200 even if category does not exist (current behavior)", async () => {
        const req = {
            params: { id: "missing" },
        };
        const res = mockRes();

        categoryModel.findByIdAndDelete.mockResolvedValueOnce(null);

        await deleteCategoryController(req, res);

        expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("missing");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
            })
        );
    });

    test("returns 500 when database throws error", async () => {
        const req = {
            params: { id: "c1" },
        };
        const res = mockRes();

        categoryModel.findByIdAndDelete.mockRejectedValueOnce(
            new Error("DB error")
        );

        await deleteCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error while deleting category",
            })
        );
    });
});
// Qinzhe Wang A0337880U
describe("updateCategoryController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("updates category successfully and returns 200", async () => {
        const req = {
            params: { id: "c1" },
            body: { name: "NewName" },
        };
        const res = mockRes();

        const updated = { _id: "c1", name: "NewName", slug: "slug-NewName" };

        categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updated);

        await updateCategoryController(req, res);

        expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
            "c1",
            { name: "NewName", slug: "slug-NewName" },
            { new: true }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                category: updated,
            })
        );
    });

    test("returns 200 even if category does not exist (current behavior)", async () => {
        const req = {
            params: { id: "missing" },
            body: { name: "Whatever" },
        };
        const res = mockRes();

        categoryModel.findByIdAndUpdate.mockResolvedValueOnce(null);

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                category: null,
            })
        );
    });

    test("returns 500 when database throws error", async () => {
        const req = {
            params: { id: "c1" },
            body: { name: "NewName" },
        };
        const res = mockRes();

        categoryModel.findByIdAndUpdate.mockRejectedValueOnce(
            new Error("DB error")
        );

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error while updating category",
            })
        );
    });
});
