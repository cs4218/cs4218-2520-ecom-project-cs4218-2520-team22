import { getProductController } from "./productController";
import productModel from "../models/productModel";

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
