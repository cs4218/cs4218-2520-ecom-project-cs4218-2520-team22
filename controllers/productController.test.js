import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController
} from "./productController";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import orderModel from "../models/orderModel";
import { mockGenerate, mockSale } from "braintree";

jest.mock("../models/productModel");
jest.mock("../models/categoryModel");
jest.mock("../models/orderModel");

jest.mock("braintree", () => {
  const mockGenerate = jest.fn();
  const mockSale = jest.fn();

  return {
		__esModule: true,
		default: {
			BraintreeGateway: jest.fn(() => {
        return {
          clientToken: {
            generate: mockGenerate
          },
          transaction: {
            sale: mockSale
          }
        }
      }),
			Environment: { Sandbox: "sandbox" }
		},
    mockGenerate,
    mockSale
	};
});

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

describe("productFiltersController", () => {
  let req, res, mockProducts;

  beforeEach(() => {
    req = {
      body: {
        checked: ["cat1", "cat2"],
        radio: [10, 100],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      { name: "Product 1", category: "cat1", price: 20 },
      { name: "Product 2", category: "cat2", price: 50 },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should filter products by category and price and send a success response", async () => {
    const findMock = jest.fn().mockResolvedValue(mockProducts);
    productModel.find = findMock;

    await productFiltersController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      category: req.body.checked,
      price: { $gte: req.body.radio[0], $lte: req.body.radio[1] },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should filter products by category only", async () => {
    req.body.radio = [];
    const findMock = jest.fn().mockResolvedValue(mockProducts);
    productModel.find = findMock;

    await productFiltersController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      category: req.body.checked,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should filter products by price only", async () => {
    req.body.checked = [];
    req.body.radio = [10, 100];
    const findMock = jest.fn().mockResolvedValue(mockProducts);
    productModel.find = findMock;

    await productFiltersController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      price: { $gte: req.body.radio[0], $lte: req.body.radio[1] },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";
    const findMock = jest.fn().mockRejectedValue(new Error(errorMessage));
    productModel.find = findMock;

    await productFiltersController(req, res);

    expect(findMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Filtering Products",
      error: expect.any(Error),
    });
  });
});

describe("productCountController", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get product count and send a success response", async () => {
    const estimatedDocumentCountMock = jest.fn().mockResolvedValue(42);
    productModel.find = jest.fn().mockReturnThis();
    productModel.estimatedDocumentCount = estimatedDocumentCountMock;

    await productCountController(req, res);

    expect(estimatedDocumentCountMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 42,
    });
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";
    const estimatedDocumentCountMock = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));
    productModel.find = jest.fn().mockReturnThis();
    productModel.estimatedDocumentCount = estimatedDocumentCountMock;

    await productCountController(req, res);

    expect(estimatedDocumentCountMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error in product count",
      error: expect.any(Error),
      success: false,
    });
  });
});

describe("productListController", () => {
  let req, res, mockProducts;

  beforeEach(() => {
    req = {
      params: { page: 2 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      { name: "Product 7" },
      { name: "Product 8" },
      { name: "Product 9" },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get products for the specified page and send a success response", async () => {
    const findMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockResolvedValue(mockProducts);

    // Mock the productModel methods
    findMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      skip: skipMock,
    });
    skipMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockReturnValue({
      sort: sortMock,
    });

    // Attach the mocks to productModel
    productModel.find = findMock;

    await productListController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(skipMock).toHaveBeenCalledWith(6); // (page-1)*perPage = (2-1)*6 = 6
    expect(limitMock).toHaveBeenCalledWith(6);
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";

    const findMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockRejectedValue(new Error(errorMessage));

    // Mock the productModel methods
    findMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      skip: skipMock,
    });
    skipMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockReturnValue({
      sort: sortMock,
    });

    // Attach the mocks to productModel
    productModel.find = findMock;

    await productListController(req, res);

    expect(findMock).toHaveBeenCalledWith({});
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(skipMock).toHaveBeenCalledWith(6);
    expect(limitMock).toHaveBeenCalledWith(6);
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error in per page ctrl",
      error: expect.any(Error),
    });
  });
});

describe("searchProductController", () => {
  let req, res, mockResults;

  beforeEach(() => {
    req = {
      params: { keyword: "test" },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockResults = [
      { name: "Test Product", description: "A product for testing" },
      { name: "Another Product", description: "Test description" },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should search products by keyword and return results", async () => {
    const findMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockResolvedValue(mockResults);

    // Mock the productModel methods
    findMock.mockReturnValue({
      select: selectMock,
    });

    productModel.find = findMock;

    await searchProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: req.params.keyword, $options: "i" } },
        { description: { $regex: req.params.keyword, $options: "i" } },
      ],
    });
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(res.json).toHaveBeenCalledWith(mockResults);
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";
    const findMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockRejectedValue(new Error(errorMessage));

    findMock.mockReturnValue({
      select: selectMock,
    });

    productModel.find = findMock;

    await searchProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: req.params.keyword, $options: "i" } },
        { description: { $regex: req.params.keyword, $options: "i" } },
      ],
    });
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error In Search Product API",
      error: expect.any(Error),
    });
  });
});

describe("relatedProductController", () => {
  let req, res, mockProducts;

  beforeEach(() => {
    req = {
      params: { pid: "test-pid", cid: "test-cid" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      { name: "Related Product 1" },
      { name: "Related Product 2" },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch related products and send a success response", async () => {
    const findMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue(mockProducts);

    // Mock the productModel methods
    findMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockReturnValue({
      populate: populateMock,
    });

    // Attach the mocks to productModel
    productModel.find = findMock;

    await relatedProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      category: req.params.cid,
      _id: { $ne: req.params.pid },
    });
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(limitMock).toHaveBeenCalledWith(3);
    expect(populateMock).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";

    const findMock = jest.fn().mockReturnThis();
    const selectMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockRejectedValue(new Error(errorMessage));

    // Mock the productModel methods
    findMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockReturnValue({
      populate: populateMock,
    });

    // Attach the mocks to productModel
    productModel.find = findMock;

    await relatedProductController(req, res);

    expect(findMock).toHaveBeenCalledWith({
      category: req.params.cid,
      _id: { $ne: req.params.pid },
    });
    expect(selectMock).toHaveBeenCalledWith("-photo");
    expect(limitMock).toHaveBeenCalledWith(3);
    expect(populateMock).toHaveBeenCalledWith("category");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting related product",
      error: expect.any(Error),
    });
  });
});

describe("productCategoryController", () => {
  let req, res, mockCategory, mockProducts;

  beforeEach(() => {
    req = {
      params: { slug: "test-slug" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockCategory = { name: "Test Category", slug: "test-slug" };
    mockProducts = [
      { name: "Product 1", category: mockCategory },
      { name: "Product 2", category: mockCategory },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch products by category and send a success response", async () => {
    const findOneMock = jest.fn().mockResolvedValue(mockCategory);
    const findMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue(mockProducts);

    // Mock the productModel methods
    findMock.mockReturnValue({
      populate: populateMock,
    });

    // Mock the categoryModel and productModel methods
    categoryModel.findOne = findOneMock;
    productModel.find = findMock;

    await productCategoryController(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ slug: req.params.slug });
    expect(findMock).toHaveBeenCalledWith({ category: mockCategory });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: mockProducts,
    });
  });

  it("should handle errors and send a failure response", async () => {
    const errorMessage = "Database error";

    const findOneMock = jest.fn().mockRejectedValue(new Error(errorMessage));

    // Mock the categoryModel method
    categoryModel.findOne = findOneMock;

    await productCategoryController(req, res);

    expect(findOneMock).toHaveBeenCalledWith({ slug: req.params.slug });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting products",
      error: expect.any(Error),
    });
  });
});

describe("brainTreeTokenController", () => {
  let res
  const req = {}

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  it("generates token successfully", async () => {
    const successfulTokenGeneration = { clientToken: "test" }
    mockGenerate.mockImplementationOnce((payload, callback) => {
      callback(null, successfulTokenGeneration);
    });

    await braintreeTokenController(req, res);

    expect(res.send).toHaveBeenCalledWith(successfulTokenGeneration);
    expect(res.status).not.toHaveBeenCalled();
  });
  
  it("generates token unsuccessfully", async () => {
    const unsuccessfulTokenGeneration = new Error("Test Error");
    mockGenerate.mockImplementationOnce((payload, callback) => {
      callback(unsuccessfulTokenGeneration, null);
    });
    
    await braintreeTokenController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(unsuccessfulTokenGeneration);
  });

  it("runs into an error when calling braintree gateway", async () => {
    const unsuccessfulTokenGeneration = new Error("Test Error");
    mockGenerate.mockImplementationOnce((payload, callback) => {
      throw unsuccessfulTokenGeneration
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await braintreeTokenController(req, res);
    
    expect(res.send).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(unsuccessfulTokenGeneration);
  });
});

describe("brainTreePaymentController", () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {
        nonce: "test",
        cart: [{ price: 20 }, { price: 30 }],
      },
      user: { _id: "1" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it("makes payment successfully via braintree gateway", async () => {
    const successfulTransaction = { success: true };
    mockSale.mockImplementationOnce((payload, callback) => {
      callback(null, successfulTransaction);
    });
    const saveMock = jest.fn().mockResolvedValue(true);
    orderModel.mockImplementationOnce(() => ({
      save: saveMock
    }));

    await brainTreePaymentController(req, res);

    expect(mockSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50,
        paymentMethodNonce: "test",
        options: {
          submitForSettlement: true,
        }
      }),
      expect.any(Function)
    );
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("makes payment unsuccessfully via braintree gateway", async () => {
    const unsuccessfulTransaction = new Error("Test Error");
    mockSale.mockImplementationOnce((payload, callback) => {
      callback(unsuccessfulTransaction, null);
    });
    const saveMock = jest.fn();
    orderModel.mockImplementationOnce(() => ({
      save: saveMock
    }));

    await brainTreePaymentController(req, res);

    expect(mockSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50,
        paymentMethodNonce: "test",
        options: {
          submitForSettlement: true,
        }
      }),
      expect.any(Function)
    );
    expect(saveMock).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(unsuccessfulTransaction);
  });

  describe("runs into an error when", () => {
    it("calling braintree gateway", async () => {
      const unsuccessfulGatewayError = new Error("Test Error");
      mockSale.mockImplementationOnce((payload, callback) => {
        throw unsuccessfulGatewayError;
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  
      await brainTreePaymentController(req, res);
  
      expect(mockSale).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50,
          paymentMethodNonce: "test",
          options: {
            submitForSettlement: true,
          }
        }),
        expect.any(Function)
      );
      expect(consoleSpy).toHaveBeenCalledWith(unsuccessfulGatewayError);
    });
  
    it("cart is undefined", async () => {
      req = {
        body: {
          nonce: "test",
          cart: undefined
        },
        user: { _id: "1" },
      };
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  
      await brainTreePaymentController(req, res);
  
      expect(mockSale).toHaveBeenCalledTimes(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
  
    it("cart is not an array", async () => {
      req = {
        body: {
          nonce: "test",
          cart: "cart"
        },
        user: { _id: "1" },
      };
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  
      await brainTreePaymentController(req, res);
  
      expect(mockSale).toHaveBeenCalledTimes(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
  
    it("cart product's price is not a finite number", async () => {
      req = {
        body: {
          nonce: "test",
          cart: [{ price: 20 }, {}],
        },
        user: { _id: "1" },
      };
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  
      await brainTreePaymentController(req, res);
  
      expect(mockSale).toHaveBeenCalledTimes(0);
      expect(consoleSpy).toHaveBeenCalledWith(new Error("Price is invalid for product"));
    });
  });
});
