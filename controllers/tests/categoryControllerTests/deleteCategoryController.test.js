
import { deleteCategoryController } from "../../categoryController";
import categoryModel from "../../../models/categoryModel";

jest.mock("../../../models/categoryModel", () => {
    const ctor = jest.fn();
    ctor.findByIdAndDelete = jest.fn();
    return ctor;
});

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

describe("deleteCategoryCOntroller", () => {
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
