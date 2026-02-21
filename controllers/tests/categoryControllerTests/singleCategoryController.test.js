// Written by Qinzhe Wang A0337880U
import { singleCategoryController } from "../../categoryController";
import categoryModel from "../../../models/categoryModel";

jest.mock("../../../models/categoryModel", () => {
    const ctor = jest.fn();
    ctor.findOne = jest.fn();
    return ctor;
});

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

describe("singleCategoryController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns 200 and the category when found", async () => {
        const req = {
            params: { slug: "electronics" },
        };
        const res = mockRes();

        const cat = { _id: "c1", name: "Electronics", slug: "electronics" };
        categoryModel.findOne.mockResolvedValueOnce(cat);

        await singleCategoryController(req, res);

        expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                category: cat,
            })
        );
    });

    test("returns 200 with null when category does not exist (current behavior)", async () => {
        const req = {
            params: { slug: "missing" },
        };
        const res = mockRes();

        categoryModel.findOne.mockResolvedValueOnce(null);

        await singleCategoryController(req, res);

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
            params: { slug: "electronics" },
        };
        const res = mockRes();

        categoryModel.findOne.mockRejectedValueOnce(
            new Error("DB error")
        );

        await singleCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error While getting Single Category",
            })
        );
    });
});

