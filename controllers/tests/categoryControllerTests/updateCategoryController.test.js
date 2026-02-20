import { updateCategoryController } from "../../categoryController";
import categoryModel from "../../../models/categoryModel";
import slugify from "slugify";

jest.mock("slugify", () => jest.fn((s) => `slug-${s}`));

jest.mock("../../../models/categoryModel", () => {
    const ctor = jest.fn();
    ctor.findByIdAndUpdate = jest.fn();
    return ctor;
});

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

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
