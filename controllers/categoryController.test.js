// Lim Jun Xian A0259094U
import categoryModel from "../models/categoryModel";
import { categoryController, singleCategoryController } from "./categoryController";

jest.mock("../models/categoryModel");

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