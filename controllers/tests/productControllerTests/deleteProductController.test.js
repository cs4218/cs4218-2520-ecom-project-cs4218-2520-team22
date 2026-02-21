// Written by Qinzhe Wang A0337880U
import { deleteProductController } from "../../productController";
import productModel from "../../../models/productModel";

jest.mock("../../../models/productModel", () => ({
    findByIdAndDelete: jest.fn(),
}));
jest.mock("braintree", () => {
    return {
        Environment: {
            Sandbox: "Sandbox",
        },
        BraintreeGateway: jest.fn().mockImplementation(() => ({
            transaction: {
                sale: jest.fn(),
            },
        })),
    };
});
function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

describe("deleteProductController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("deletes product and returns 200", async () => {
        const req = { params: { pid: "p1" } };
        const res = mockRes();

        const query = {
            select: jest.fn().mockResolvedValueOnce(null),
        };

        productModel.findByIdAndDelete.mockReturnValueOnce(query);

        await deleteProductController(req, res);

        expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("p1");
        expect(query.select).toHaveBeenCalledWith("-photo");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Product Deleted successfully",
            })
        );
    });

    test("returns 500 when database throws error", async () => {
        const req = { params: { pid: "p1" } };
        const res = mockRes();

        const query = {
            select: jest.fn().mockRejectedValueOnce(new Error("DB error")),
        };

        productModel.findByIdAndDelete.mockReturnValueOnce(query);

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error while deleting product",
            })
        );
    });
});
