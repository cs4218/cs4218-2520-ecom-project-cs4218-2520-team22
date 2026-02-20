import fs from "fs";
import slugify from "slugify";
import productModel from "../../../models/productModel";
import { updateProductController } from "../../productController";

jest.mock("fs", () => ({
    readFileSync: jest.fn(),
}));

jest.mock("slugify", () => jest.fn((s) => `slug-${s}`));

jest.mock("../../../models/productModel", () => ({
    findByIdAndUpdate: jest.fn(),
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

describe("updateProductController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns 500 when name is missing", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
        expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("returns 500 when description is missing", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "N",  price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
        expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    test("returns 500 when price is missing", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "N", description: "d",  category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
        expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    test("returns 500 when category is missing", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "N", description: "d", price: 10,  quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
        expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    test("returns 500 when quantity is missing", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "N", description: "d", price: 10, category: "c",  shipping: true },
            files: {},
        };
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
        expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("returns 500 when photo size > 1mb", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "Phone", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: { photo: { size: 1000001, path: "/tmp/a", type: "image/png" } },
        };
        const res = mockRes();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Photo is required and should be less than 1MB",
        });
        expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    test("updates product without photo and returns 201", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "Phone", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        const saveMock = jest.fn().mockResolvedValueOnce(undefined);

        // findByIdAndUpdate 返回的必须是“可被后续使用”的对象
        const productDoc = {
            _id: "p1",
            name: "Phone",
            photo: { data: null, contentType: null },
            save: saveMock,
        };

        productModel.findByIdAndUpdate.mockResolvedValueOnce(productDoc);

        await updateProductController(req, res);

        expect(slugify).toHaveBeenCalledWith("Phone");

        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
            "p1",
            expect.objectContaining({
                name: "Phone",
                slug: "slug-Phone",
            }),
            { new: true }
        );

        expect(saveMock).toHaveBeenCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Product Updated Successfully",
                products: productDoc,
            })
        );
    });

    test("updates product with photo, sets photo fields, and returns 201", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "Phone", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: { photo: { size: 999999, path: "/tmp/p.png", type: "image/png" } },
        };
        const res = mockRes();

        fs.readFileSync.mockReturnValueOnce(Buffer.from("fake"));

        const saveMock = jest.fn().mockResolvedValueOnce(undefined);

        const productDoc = {
            _id: "p1",
            name: "Phone",
            photo: { data: null, contentType: null },
            save: saveMock,
        };

        productModel.findByIdAndUpdate.mockResolvedValueOnce(productDoc);

        await updateProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p.png");
        expect(productDoc.photo.data).toEqual(Buffer.from("fake"));
        expect(productDoc.photo.contentType).toBe("image/png");

        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test("returns 500 when database throws", async () => {
        const req = {
            params: { pid: "p1" },
            fields: { name: "Phone", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        productModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("DB down"));

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error in Updating product",
            })
        );
    });
});
