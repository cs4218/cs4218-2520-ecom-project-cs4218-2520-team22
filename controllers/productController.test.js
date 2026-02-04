import {
  getProductController,
  getSingleProductController,
  productPhotoController,
} from "./productController";
import productModel from "../models/productModel";
import { describe } from "node:test";

jest.mock("../models/productModel");

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

describe("getProductController", () => {
  let req, res, mockProducts;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      { name: "Product 1", category: "Category 1" },
      { name: "Product 2", category: "Category 2" },
      { name: "Product 3", category: "Category 3" },
      { name: "Product 4", category: "Category 4" },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch all products and send a success response", async () => {
    const findMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockResolvedValue(mockProducts);

    // Mock the productModel methods
    findMock.mockReturnValue({
      populate: populateMock,
    });
    populateMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockReturnValue({
      sort: sortMock,
    });

    // Attach the mocks to productModel
    productModel.find = findMock;

    await getProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(populateMock).toHaveBeenCalledWith("category");
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(limitMock).toHaveBeenCalledWith(12);
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      countTotal: mockProducts.length,
      message: "All Products",
      products: mockProducts,
    });
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";

    const findMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockRejectedValue(new Error(errorMessage));

    // Mock the productModel methods
    findMock.mockReturnValue({
      populate: populateMock,
    });
    populateMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockReturnValue({
      sort: sortMock,
    });

    // Attach the mocks to productModel
    productModel.find = findMock;

    await getProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(populateMock).toHaveBeenCalledWith("category");
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(limitMock).toHaveBeenCalledWith(12);
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting products",
      error: errorMessage,
    });
  });
});

describe("getSingleProductController", () => {
  let req, res, mockProduct;

  beforeEach(() => {
    req = {
      params: { slug: "test-slug" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProduct = {
      name: "Test Product",
      slug: "test-slug",
      category: "Test Category",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch a single product and send a success response", async () => {
    const findOneMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue(mockProduct);

    // Mock the productModel methods
    findOneMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      populate: populateMock,
    });

    // Attach the mocks to productModel
    productModel.findOne = findOneMock;

    await getSingleProductController(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ slug: req.params.slug });
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(populateMock).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: mockProduct,
    });
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";

    const findOneMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockRejectedValue(new Error(errorMessage));

    // Mock the productModel methods
    findOneMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      populate: populateMock,
    });

    // Attach the mocks to productModel
    productModel.findOne = findOneMock;

    await getSingleProductController(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ slug: req.params.slug });
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(populateMock).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting single product",
      error: expect.any(Error),
    });
  });
});

describe("productPhotoController", () => {
  let req, res, mockProduct;

  beforeEach(() => {
    req = {
      params: { pid: "test-product-id" },
    };
    res = {
      set: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockProduct = {
      photo: {
        data: Buffer.from("test-photo-data"),
        contentType: "image/png",
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch product photo and send it in the response", async () => {
    const findByIdMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockResolvedValue(mockProduct);

    // Mock the productModel methods
    findByIdMock.mockReturnValue({
      select: selectMock,
    });

    // Attach the mocks to productModel
    productModel.findById = findByIdMock;

    await productPhotoController(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(req.params.pid);
    expect(selectMock).toHaveBeenCalledWith("photo");
    expect(res.set).toHaveBeenCalledWith(
      "Content-type",
      mockProduct.photo.contentType,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";

    const findByIdMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockRejectedValue(new Error(errorMessage));

    // Mock the productModel methods
    findByIdMock.mockReturnValue({
      select: selectMock,
    });

    // Attach the mocks to productModel
    productModel.findById = findByIdMock;

    await productPhotoController(req, res);

    expect(findByIdMock).toHaveBeenCalledWith(req.params.pid);
    expect(selectMock).toHaveBeenCalledWith("photo");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting photo",
      error: expect.any(Error),
    });
  });
});
