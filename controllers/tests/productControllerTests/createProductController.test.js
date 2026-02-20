import fs from "fs";
import slugify from "slugify";
import productModel from "../../../models/productModel";
import {createProductController} from "../../productController";

jest.mock("fs", () => ({
    readFileSync: jest.fn(),
}));

jest.mock("slugify", () => jest.fn((s) => `slug-${s}`));

// mock productModel：需要 mock 构造(new) + 实例.save()
jest.mock("../../../models/productModel", () => {
    return jest.fn();
});

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

describe("createProductController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns 500 when name is missing", async () => {
        const req = {
            fields: { description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
        expect(productModel).not.toHaveBeenCalled();
    });

    test("returns 500 when description is missing", async () => {
        const req = {
            fields: { name: "N", price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
        expect(productModel).not.toHaveBeenCalled();
    });
    test("returns 500 when price is missing", async () => {
        const req = {
            fields: { name: "N", description: "d", category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
        expect(productModel).not.toHaveBeenCalled();
    });
    test("returns 500 when category is missing", async () => {
        const req = {
            fields: { name: "N", description: "d", price: 10, quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
        expect(productModel).not.toHaveBeenCalled();
    });
    test("returns 500 when quantity is missing", async () => {
        const req = {
            fields: { name: "N", description: "d", price: 10, category: "c", shipping: true },
            files: {},
        };
        const res = mockRes();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
        expect(productModel).not.toHaveBeenCalled();
    });
    test("returns 500 when photo size > 1mb", async () => {
        const req = {
            fields: { name: "N", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: { photo: { size: 1000001, path: "/tmp/a", type: "image/png" } },
        };
        const res = mockRes();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            error: "Photo is required and should be less than 1MB",
        });
        expect(productModel).not.toHaveBeenCalled();
        expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    test("creates product without photo and returns 201", async () => {
        const req = {
            fields: { name: "Phone", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        // 伪造 new productModel(...) 返回的实例结构
        const saveMock = jest.fn().mockResolvedValueOnce(undefined);
        const productInstance = {
            photo: { data: null, contentType: null },
            save: saveMock,
        };

        productModel.mockImplementationOnce(function (doc) {
            // 保存构造参数以便断言
            this._doc = doc;
            return productInstance;
        });

        await createProductController(req, res);

        expect(slugify).toHaveBeenCalledWith("Phone");
        expect(productModel).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Phone",
                slug: "slug-Phone",
            })
        );

        expect(saveMock).toHaveBeenCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Product Created Successfully",
            })
        );
    });

    test("creates product with photo and sets photo fields", async () => {
        const req = {
            fields: { name: "Phone", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: { photo: { size: 999999, path: "/tmp/p.png", type: "image/png" } },
        };
        const res = mockRes();

        fs.readFileSync.mockReturnValueOnce(Buffer.from("fake"));

        const saveMock = jest.fn().mockResolvedValueOnce(undefined);
        const productInstance = {
            photo: { data: null, contentType: null },
            save: saveMock,
        };

        productModel.mockImplementationOnce(function () {
            return productInstance;
        });

        await createProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p.png");
        expect(productInstance.photo.data).toEqual(Buffer.from("fake"));
        expect(productInstance.photo.contentType).toBe("image/png");

        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test("returns 500 when save throws", async () => {
        const req = {
            fields: { name: "Phone", description: "d", price: 10, category: "c", quantity: 1, shipping: true },
            files: {},
        };
        const res = mockRes();

        const saveMock = jest.fn().mockRejectedValueOnce(new Error("save failed"));
        const productInstance = { photo: { data: null, contentType: null }, save: saveMock };

        productModel.mockImplementationOnce(function () {
            return productInstance;
        });

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Error in creating product",
            })
        );
    });
});
