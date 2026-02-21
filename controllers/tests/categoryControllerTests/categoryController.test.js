// Written by Qinzhe Wang A0337880U
import { categoryController } from "../../categoryController";
import categoryModel from "../../../models/categoryModel";

jest.mock("../../../models/categoryModel", () => {
    const ctor = jest.fn();
    ctor.find = jest.fn();
    return ctor;
});

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

describe("categoryControlller (get all categories)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns 200 and all categories", async () => {
        const req = {};
        const res = mockRes();

        const cats = [
            { _id: "c1", name: "Electronics" },
            { _id: "c2", name: "Books" },
        ];

        categoryModel.find.mockResolvedValueOnce(cats);

        await categoryController(req, res);

        expect(categoryModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "All Categories List",
                category: cats,
            })
        );
    });

    test("returns 500 when database throws", async () => {
        const req = {};
        const res = mockRes();

        categoryModel.find.mockRejectedValueOnce(new Error("DB error"));

        await categoryController(req, res);

        expect(categoryModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error while getting all categories",
            })
        );
    });
    test("returns 200 with empty list when no categories exist", async () => {
        const req = {};
        const res = mockRes();

        categoryModel.find.mockResolvedValueOnce([]);

        await categoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ category: [] })
        );
    });
});
