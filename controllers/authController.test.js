// Song Yichao, A0255686M

// mocks
const mockUserModel = jest.fn();
mockUserModel.findOne = jest.fn();
mockUserModel.findById = jest.fn();
mockUserModel.findByIdAndUpdate = jest.fn();

const mockOrderModel = {
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const mockAuthHelper = {
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
};

const mockJWT = {
  sign: jest.fn(),
};

jest.mock("../models/userModel.js", () => ({
  __esModule: true,
  default: mockUserModel,
}));

jest.mock("../models/orderModel.js", () => ({
  __esModule: true,
  default: mockOrderModel,
}));

jest.mock("../helpers/authHelper.js", () => ({
  __esModule: true,
  hashPassword: (...args) => mockAuthHelper.hashPassword(...args),
  comparePassword: (...args) => mockAuthHelper.comparePassword(...args),
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: mockJWT,
}));

// controllers loaded after mocks
let registerController;
let loginController;
let forgotPasswordController;
let testController;
let updateProfileController;
let getOrdersController;
let getAllOrdersController;
let orderStatusController;

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const USER_ID = "507f1f77bcf86cd799439011";
const BUYER_ID = "507f1f77bcf86cd799439012";
const ORDER_ID = "507f1f77bcf86cd799439013";

let logSpy;

describe("authController unit tests", () => {
  beforeAll(async () => {
    // dynamic import ESM module from CJS test
    const mod = await import("./authController.js");
    registerController = mod.registerController;
    loginController = mod.loginController;
    forgotPasswordController = mod.forgotPasswordController;
    testController = mod.testController;
    updateProfileController = mod.updateProfileController;
    getOrdersController = mod.getOrdersController;
    getAllOrdersController = mod.getAllOrdersController;
    orderStatusController = mod.orderStatusController;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test_secret";
    logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  // Order Controllers
  describe("Order Controllers", () => {
    describe("updateProfileController", () => {
      // add test case, Song Yichao, A0255686M
      it("should return error JSON if password is provided but < 6 chars", async () => {
        const req = { user: { _id: USER_ID }, body: { password: "123" } };
        const res = makeRes();

        // controller calls findById before checking password length
        mockUserModel.findById.mockResolvedValueOnce({
          _id: USER_ID,
          name: "Old",
          password: "oldhash",
          phone: "111",
          address: { line1: "OldAddr" },
        });

        await updateProfileController(req, res);

        expect(res.json).toHaveBeenCalledWith({
          error: "Password is required and 6 characters long",
        });
        expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
      });

      // add test case, Song Yichao, A0255686M
      it("should update profile using existing password when no new password is provided", async () => {
        const req = {
          user: { _id: USER_ID },
          body: { name: "NewName", phone: "999", address: { line1: "NewAddr" } },
        };
        const res = makeRes();

        mockUserModel.findById.mockResolvedValueOnce({
          _id: USER_ID,
          name: "OldName",
          password: "oldhash",
          phone: "111",
          address: { line1: "OldAddr" },
        });

        mockUserModel.findByIdAndUpdate.mockResolvedValueOnce({
          _id: USER_ID,
          name: "NewName",
          password: "oldhash",
          phone: "999",
          address: { line1: "NewAddr" },
        });

        await updateProfileController(req, res);

        expect(mockAuthHelper.hashPassword).not.toHaveBeenCalled();
        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
          USER_ID,
          {
            name: "NewName",
            password: "oldhash",
            phone: "999",
            address: { line1: "NewAddr" },
          },
          { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: expect.any(Object),
          })
        );
      });

      // add test case, Song Yichao, A0255686M
      it("should hash password and update profile when new password is provided", async () => {
        const req = { user: { _id: USER_ID }, body: { password: "newpass", phone: "222" } };
        const res = makeRes();

        mockUserModel.findById.mockResolvedValueOnce({
          _id: USER_ID,
          name: "OldName",
          password: "oldhash",
          phone: "111",
          address: { line1: "OldAddr" },
        });

        mockAuthHelper.hashPassword.mockResolvedValueOnce("newhash");

        mockUserModel.findByIdAndUpdate.mockResolvedValueOnce({
          _id: USER_ID,
          name: "OldName",
          password: "newhash",
          phone: "222",
          address: { line1: "OldAddr" },
        });

        await updateProfileController(req, res);

        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("newpass");
        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
          USER_ID,
          {
            name: "OldName",
            password: "newhash",
            phone: "222",
            address: { line1: "OldAddr" },
          },
          { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
      });

      // add test case, Song Yichao, A0255686M
      it("should handle errors and return 400 with message", async () => {
        const req = { user: { _id: USER_ID }, body: { name: "X" } };
        const res = makeRes();

        mockUserModel.findById.mockRejectedValueOnce(new Error("db error"));

        await updateProfileController(req, res);

        expect(logSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error While Updating profile",
          })
        );
      });
    });

    describe("getOrdersController", () => {
      // add test case, Song Yichao, A0255686M
      it("should return orders for logged-in buyer with populate chain", async () => {
        const req = { user: { _id: BUYER_ID } };
        const res = makeRes();

        const mockOrders = [{ _id: "o1" }, { _id: "o2" }];

        const queryChain = {
          populate: jest.fn().mockReturnThis(),
          then: undefined,
        };
        queryChain.then = (resolve) => resolve(mockOrders);

        mockOrderModel.find.mockReturnValueOnce(queryChain);

        await getOrdersController(req, res);

        expect(mockOrderModel.find).toHaveBeenCalledWith({ buyer: BUYER_ID });
        expect(queryChain.populate).toHaveBeenNthCalledWith(1, "products", "-photo");
        expect(queryChain.populate).toHaveBeenNthCalledWith(2, "buyer", "name");
        expect(res.json).toHaveBeenCalledWith(mockOrders);
      });

      // add test case, Song Yichao, A0255686M
      it("should return 500 when getOrdersController throws (covers catch)", async () => {
        const req = { user: { _id: BUYER_ID } };
        const res = makeRes();

        mockOrderModel.find.mockImplementationOnce(() => {
          throw new Error("query failed");
        });

        await getOrdersController(req, res);

        expect(logSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
            error: expect.anything(),
          })
        );
      });
    });

    describe("getAllOrdersController", () => {
      // add test case, Song Yichao, A0255686M
      it("should return all orders with populate chain and sort by createdAt desc", async () => {
        const req = {};
        const res = makeRes();

        const mockOrders = [{ _id: "a1" }];

        const queryChain = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          then: undefined,
        };
        queryChain.then = (resolve) => resolve(mockOrders);

        mockOrderModel.find.mockReturnValueOnce(queryChain);

        await getAllOrdersController(req, res);

        expect(mockOrderModel.find).toHaveBeenCalledWith({});
        expect(queryChain.populate).toHaveBeenNthCalledWith(1, "products", "-photo");
        expect(queryChain.populate).toHaveBeenNthCalledWith(2, "buyer", "name");
        expect(queryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(res.json).toHaveBeenCalledWith(mockOrders);
      });

      // add test case, Song Yichao, A0255686M
      it("should return 500 when getAllOrdersController throws (covers catch)", async () => {
        const req = {};
        const res = makeRes();

        mockOrderModel.find.mockImplementationOnce(() => {
          throw new Error("query failed");
        });

        await getAllOrdersController(req, res);

        expect(logSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error While Getting All Orders",
            error: expect.anything(),
          })
        );
      });
    });

    describe("orderStatusController", () => {
      // add test case, Song Yichao, A0255686M
      // modified by Qinzhe Wang, A0337880U
      it("should update order status and return updated order", async () => {
        const req = { params: { orderId: ORDER_ID }, body: { status: "Shipped" } };
        const res = makeRes();

        const updated = { _id: ORDER_ID, status: "Shipped" };
        mockOrderModel.findByIdAndUpdate.mockResolvedValueOnce(updated);

        await orderStatusController(req, res);

        expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
          ORDER_ID,
          { status: "Shipped" },
          { new: true ,
            runValidators: true}
        );
        expect(res.json).toHaveBeenCalledWith(updated);
      });

      // add test case, Song Yichao, A0255686M
      it("should return 500 when orderStatusController throws (covers catch)", async () => {
        const req = { params: { orderId: ORDER_ID }, body: { status: "Shipped" } };
        const res = makeRes();

        mockOrderModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("db error"));

        await orderStatusController(req, res);

        expect(logSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error While Updating Order",
            error: expect.anything(),
          })
        );
      });
    });
  });

  // Login Controllers
  describe("Login controllers", () => {
    describe("registerController", () => {
      // added the test case, Daniel Lai, A0192327A
      it("should return error when name is missing", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Street",
            answer: "security answer",
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await registerController(testReq, testRes); // Act

        expect(testRes.send).toHaveBeenCalledWith({ error: "Name is Required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when email is missing", async () => {
        const testReq = {
          body: {
            name: "Test User",
            password: "password123",
            phone: "1234567890",
            address: "123 Street",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await registerController(testReq, testRes); // Act

        expect(testRes.send).toHaveBeenCalledWith({ message: "Email is Required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when password is missing", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            address: "123 Street",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await registerController(testReq, testRes); // Act

        expect(testRes.send).toHaveBeenCalledWith({ message: "Password is Required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when phone is missing", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            address: "123 Street",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await registerController(testReq, testRes); // Act

        expect(testRes.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when address is missing", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await registerController(testReq, testRes); // Act

        expect(testRes.send).toHaveBeenCalledWith({ message: "Address is Required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when answer is missing", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Street"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await registerController(testReq, testRes); // Act

        expect(testRes.send).toHaveBeenCalledWith({ message: "Answer is Required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should handle existing user re-registration", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "existing@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Street",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockResolvedValue({ email: "existing@example.com" });

        await registerController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "existing@example.com" });
        expect(testRes.status).toHaveBeenCalledWith(200);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Already registered, please login",
        });
        expect(mockAuthHelper.hashPassword).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should handle password hashing failure", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Street",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockResolvedValue(null);
        mockAuthHelper.hashPassword.mockRejectedValue(new Error("Hashing failed"));
        jest.spyOn(console, 'log').mockImplementation(() => { });

        await registerController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("password123");
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        expect(testRes.status).toHaveBeenCalledWith(500);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in Registration",
          error: expect.any(Error),
        });
      });

      // added the test case, Daniel Lai, A0192327A
      it("should handle user save failure", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Street",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockResolvedValue(null);
        mockAuthHelper.hashPassword.mockResolvedValue("hashedPassword123");

        const mockSave = jest.fn().mockRejectedValue(new Error("Database save failed"));
        mockUserModel.mockImplementationOnce(() => ({ save: mockSave }));
        jest.spyOn(console, 'log').mockImplementation(() => { });

        await registerController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("password123");
        expect(mockUserModel).toHaveBeenCalledWith({
          name: "Test User",
          email: "test@example.com",
          phone: "1234567890",
          address: "123 Street",
          password: "hashedPassword123",
          answer: "security answer"
        });
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        expect(testRes.status).toHaveBeenCalledWith(500);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in Registration",
          error: expect.any(Error),
        });
      });

      it("should successfully register a new user", async () => {
        const testReq = {
          body: {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Street",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockResolvedValue(null);
        mockAuthHelper.hashPassword.mockResolvedValue("hashedPassword123");

        const mockUser = { _id: "user123", name: "Test User", email: "test@example.com" };
        const mockSave = jest.fn().mockResolvedValue(mockUser);
        mockUserModel.mockImplementationOnce(() => ({ save: mockSave }));

        await registerController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("password123");
        expect(mockUserModel).toHaveBeenCalledWith({
          name: "Test User",
          email: "test@example.com",
          phone: "1234567890",
          address: "123 Street",
          password: "hashedPassword123",
          answer: "security answer"
        });
        expect(mockSave).toHaveBeenCalled();
        expect(testRes.status).toHaveBeenCalledWith(201);
        expect(testRes.send).toHaveBeenCalledWith({
          success: true,
          message: "User registered successfully",
          user: mockUser,
        });
      });

      // add test case, Song Yichao, A0255686M
      it("should return validation error when name is missing", async () => {
        const req = { body: { email: "a@b.com" } };
        const res = makeRes();

        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return already registered if user exists", async () => {
        const req = {
          body: {
            name: "A",
            email: "a@b.com",
            password: "123456",
            phone: "111",
            address: { line1: "X" },
            answer: "blue",
          },
        };
        const res = makeRes();

        mockUserModel.findOne.mockResolvedValueOnce({ _id: USER_ID });

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Already registered, please login",
          })
        );
      });

      // add test case, Song Yichao, A0255686M
      it("should return validation error when email is missing", async () => {
        const req = { body: { name: "A" } };
        const res = makeRes();

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return validation error when password is missing", async () => {
        const req = { body: { name: "A", email: "a@b.com" } };
        const res = makeRes();

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return validation error when phone is missing", async () => {
        const req = { body: { name: "A", email: "a@b.com", password: "123456" } };
        const res = makeRes();

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return validation error when address is missing", async () => {
        const req = {
          body: { name: "A", email: "a@b.com", password: "123456", phone: "111" },
        };
        const res = makeRes();

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return validation error when answer is missing", async () => {
        const req = {
          body: {
            name: "A",
            email: "a@b.com",
            password: "123456",
            phone: "111",
            address: { line1: "X" },
          },
        };
        const res = makeRes();

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should register successfully when user does not exist (covers hash + save + 201)", async () => {
        const req = {
          body: {
            name: "A",
            email: "a@b.com",
            password: "123456",
            phone: "111",
            address: { line1: "X" },
            answer: "blue",
          },
        };
        const res = makeRes();

        mockUserModel.findOne.mockResolvedValueOnce(null);
        mockAuthHelper.hashPassword.mockResolvedValueOnce("hashed_pw");

        const saveMock = jest
          .fn()
          .mockResolvedValueOnce({ _id: USER_ID, email: "a@b.com" });

        mockUserModel.mockImplementationOnce(() => ({ save: saveMock }));

        await registerController(req, res);

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("123456");
        expect(saveMock).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: "User registered successfully",
            user: expect.anything(),
          })
        );
      });

      // add test case, Song Yichao, A0255686M
      it("should return 500 when registerController throws (covers catch)", async () => {
        const req = {
          body: {
            name: "A",
            email: "a@b.com",
            password: "123456",
            phone: "111",
            address: { line1: "X" },
            answer: "blue",
          },
        };
        const res = makeRes();

        mockUserModel.findOne.mockRejectedValueOnce(new Error("db error"));

        await registerController(req, res);

        expect(logSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error in Registration",
            error: expect.anything(),
          })
        );
      });
    });

    describe("loginController", () => {
      // added the test cases, Daniel Lai, A0192327A
      it("should return error when email is missing", async () => {
        const testReq = {
          body: {
            password: "password123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await loginController(testReq, testRes); // Act

        expect(testRes.status).toHaveBeenCalledWith(404);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when password is missing", async () => {
        const testReq = {
          body: {
            email: "test@example.com"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await loginController(testReq, testRes); // Act

        expect(testRes.status).toHaveBeenCalledWith(404);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      // modified by Qinzhe Wang, A0337880U
      it("should return error when user does not exist", async () => {
        const testReq = {
          body: {
            email: "nonexistent@example.com",
            password: "password123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockResolvedValue(null);

        await loginController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
        expect(testRes.status).toHaveBeenCalledWith(401);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
        expect(mockAuthHelper.comparePassword).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      // modified by Qinzhe Wang, A0337880U
      it("should return error when password is incorrect", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            password: "wrongpassword"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        const mockUser = {
          _id: "user123",
          email: "test@example.com",
          password: "hashedPassword123"
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockAuthHelper.comparePassword.mockResolvedValue(false);

        await loginController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockAuthHelper.comparePassword).toHaveBeenCalledWith("wrongpassword", "hashedPassword123");
        expect(testRes.status).toHaveBeenCalledWith(401);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
        expect(mockJWT.sign).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      // Am assuming that comparePassword and JWT.sign will not return an error in practice
      // even if that is technically possible
      it("should handle database lookup failure", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            password: "password123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockRejectedValue(new Error("Database connection failed"));
        jest.spyOn(console, 'log').mockImplementation(() => { });

        await loginController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        expect(testRes.status).toHaveBeenCalledWith(500);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in login",
          error: expect.any(Error),
        });
      });

      // added the test case, Daniel Lai, A0192327A
      it("should successfully login with valid credentials", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            password: "password123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        const mockUser = {
          _id: "user123",
          name: "Test User",
          email: "test@example.com",
          phone: "1234567890",
          address: "123 Street",
          role: 0,
          password: "hashedPassword123"
        };
        const mockToken = "jwt-token-123";
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockAuthHelper.comparePassword.mockResolvedValue(true);
        mockJWT.sign.mockResolvedValue(mockToken);

        await loginController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockAuthHelper.comparePassword).toHaveBeenCalledWith("password123", "hashedPassword123");
        expect(mockJWT.sign).toHaveBeenCalledWith(
          { _id: "user123" },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        expect(testRes.status).toHaveBeenCalledWith(200);
        expect(testRes.send).toHaveBeenCalledWith({
          success: true,
          message: "Logged in successfully",
          user: {
            _id: "user123",
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            address: "123 Street",
            role: 0,
          },
          token: mockToken,
        });
      });

      // add test case, Song Yichao, A0255686M
      it("should login successfully and return token", async () => {
        const req = { body: { email: "a@b.com", password: "123456" } };
        const res = makeRes();

        mockUserModel.findOne.mockResolvedValueOnce({
          _id: USER_ID,
          name: "A",
          email: "a@b.com",
          phone: "111",
          address: { line1: "X" },
          role: 0,
          password: "hash",
        });

        mockAuthHelper.comparePassword.mockResolvedValueOnce(true);
        mockJWT.sign.mockReturnValueOnce("token123");

        await loginController(req, res);

        expect(mockJWT.sign).toHaveBeenCalledWith(
          { _id: USER_ID },
          "test_secret",
          { expiresIn: "7d" }
        );
        expect(res.status).toHaveBeenCalledWith(200);
      });

      // add test case, Song Yichao, A0255686M
      it("should return 500 when loginController throws (covers catch)", async () => {
        const req = { body: { email: "a@b.com", password: "123456" } };
        const res = makeRes();

        mockUserModel.findOne.mockRejectedValueOnce(new Error("db down"));

        await loginController(req, res);

        expect(logSpy).toHaveBeenCalled(); // console.log(error)
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error in login",
            error: expect.anything(),
          })
        );
      });

      // add test case, Song Yichao, A0255686M
      it("should return 404 if email or password is missing", async () => {
        const req = { body: { email: "a@b.com" } }; // missing password
        const res = makeRes();

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Invalid email or password",
          })
        );
      });

      // add test case, Song Yichao, A0255686M
      // modified by Qinzhe Wang, A0337880U
      it("should return 401 if user is not found", async () => {
        const req = { body: { email: "a@b.com", password: "123456" } };
        const res = makeRes();

        mockUserModel.findOne.mockResolvedValueOnce(null);

        await loginController(req, res);

        expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Invalid email or password",
          })
        );
      });

      // add test case, Song Yichao, A0255686M
      // modified test, Qinzhe Wang, A0337880U
      it("should return 401 if password does not match", async () => {
        const req = { body: { email: "a@b.com", password: "wrongpw" } };
        const res = makeRes();

        mockUserModel.findOne.mockResolvedValueOnce({
          _id: USER_ID,
          name: "A",
          email: "a@b.com",
          phone: "111",
          address: { line1: "X" },
          role: 0,
          password: "hash",
        });
        mockAuthHelper.comparePassword.mockResolvedValueOnce(false);

        await loginController(req, res);

        expect(mockAuthHelper.comparePassword).toHaveBeenCalledWith("wrongpw", "hash");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Invalid email or password",
          })
        );
      });
    });

    describe("forgotPasswordController", () => {
      // added the test case, Daniel Lai, A0192327A
      it("should return error when email is missing", async () => {
        const testReq = {
          body: {
            answer: "security answer",
            newPassword: "newpassword123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await forgotPasswordController(testReq, testRes); // Act

        expect(testRes.status).toHaveBeenCalledWith(400);
        expect(testRes.send).toHaveBeenCalledWith({ message: "Email is required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when answer is missing", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            newPassword: "newpassword123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await forgotPasswordController(testReq, testRes); // Act

        expect(testRes.status).toHaveBeenCalledWith(400);
        expect(testRes.send).toHaveBeenCalledWith({ message: "Answer is required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when new password is missing", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            answer: "security answer"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };

        await forgotPasswordController(testReq, testRes); // Act

        expect(testRes.status).toHaveBeenCalledWith(400);
        expect(testRes.send).toHaveBeenCalledWith({ message: "New Password is required" });
        expect(mockUserModel.findOne).not.toHaveBeenCalled();
      });

      // added the test case, Daniel Lai, A0192327A
      it("should return error when corresponding user is not found", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            answer: "wrong answer",
            newPassword: "newpassword123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockResolvedValue(null);

        await forgotPasswordController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          email: "test@example.com",
          answer: "wrong answer"
        });
        expect(testRes.status).toHaveBeenCalledWith(404);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Wrong Email Or Answer",
        });
      });

      // added the test case, Daniel Lai, A0192327A
      it("should handle password hashing failure", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            answer: "security answer",
            newPassword: "newpassword123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        const mockUser = {
          _id: "user123",
          email: "test@example.com",
          answer: "security answer"
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockAuthHelper.hashPassword.mockRejectedValue(new Error("Hashing failed"));
        jest.spyOn(console, 'log').mockImplementation(() => { });

        await forgotPasswordController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          email: "test@example.com",
          answer: "security answer"
        });
        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("newpassword123");
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        expect(testRes.status).toHaveBeenCalledWith(500);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Something went wrong",
          error: expect.any(Error),
        });
      });

      // added the test case, Daniel Lai, A0192327A
      it("should handle database lookup failure", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            answer: "security answer",
            newPassword: "newpassword123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        mockUserModel.findOne.mockRejectedValue(new Error("Database connection failed"));
        jest.spyOn(console, 'log').mockImplementation(() => { });

        await forgotPasswordController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          email: "test@example.com",
          answer: "security answer"
        });
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        expect(testRes.status).toHaveBeenCalledWith(500);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Something went wrong",
          error: expect.any(Error),
        });
      });

      // added the test case, Daniel Lai, A0192327A
      it("should handle database update failure", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            answer: "security answer",
            newPassword: "newpassword123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        const mockUser = {
          _id: "user123",
          email: "test@example.com",
          answer: "security answer"
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockAuthHelper.hashPassword.mockResolvedValue("hashedNewPassword123");
        mockUserModel.findByIdAndUpdate.mockRejectedValue(new Error("Database update failed"));
        jest.spyOn(console, 'log').mockImplementation(() => { });

        await forgotPasswordController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          email: "test@example.com",
          answer: "security answer"
        });
        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("newpassword123");
        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
          password: "hashedNewPassword123"
        });
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        expect(testRes.status).toHaveBeenCalledWith(500);
        expect(testRes.send).toHaveBeenCalledWith({
          success: false,
          message: "Something went wrong",
          error: expect.any(Error),
        });
      });

      // added the test case, Daniel Lai, A0192327A
      it("should successfully reset password with valid credentials", async () => {
        const testReq = {
          body: {
            email: "test@example.com",
            answer: "security answer",
            newPassword: "newpassword123"
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis()
        };
        const mockUser = {
          _id: "user123",
          email: "test@example.com",
          answer: "security answer"
        };
        mockUserModel.findOne.mockResolvedValue(mockUser);
        mockAuthHelper.hashPassword.mockResolvedValue("hashedNewPassword123");
        mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

        await forgotPasswordController(testReq, testRes); // Act

        expect(mockUserModel.findOne).toHaveBeenCalledWith({
          email: "test@example.com",
          answer: "security answer"
        });
        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("newpassword123");
        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
          password: "hashedNewPassword123"
        });
        expect(testRes.status).toHaveBeenCalledWith(200);
        expect(testRes.send).toHaveBeenCalledWith({
          success: true,
          message: "Password Reset Successfully",
        });
      });

      // add test case, Song Yichao, A0255686M
      it("should reset password successfully", async () => {
        const req = {
          body: { email: "a@b.com", answer: "a", newPassword: "newpw" },
        };
        const res = makeRes();

        mockUserModel.findOne.mockResolvedValueOnce({ _id: USER_ID });
        mockAuthHelper.hashPassword.mockResolvedValueOnce("newhash");
        mockUserModel.findByIdAndUpdate.mockResolvedValueOnce({ _id: USER_ID });

        await forgotPasswordController(req, res);

        expect(mockAuthHelper.hashPassword).toHaveBeenCalledWith("newpw");
        expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(USER_ID, {
          password: "newhash",
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      // add test case, Song Yichao, A0255686M
      it("should return 400 if email is missing", async () => {
        const req = { body: { answer: "a", newPassword: "newpw" } };
        const res = makeRes();

        await forgotPasswordController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return 400 if answer is missing", async () => {
        const req = { body: { email: "a@b.com", newPassword: "newpw" } };
        const res = makeRes();

        await forgotPasswordController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Answer is required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return 400 if newPassword is missing", async () => {
        const req = { body: { email: "a@b.com", answer: "a" } };
        const res = makeRes();

        await forgotPasswordController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
      });

      // add test case, Song Yichao, A0255686M
      it("should return 404 if email/answer pair is incorrect (user not found)", async () => {
        const req = { body: { email: "a@b.com", answer: "wrong", newPassword: "newpw" } };
        const res = makeRes();

        mockUserModel.findOne.mockResolvedValueOnce(null);

        await forgotPasswordController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Wrong Email Or Answer",
          })
        );
      });

      // add test case, Song Yichao, A0255686M
      it("should return 500 when forgotPasswordController throws", async () => {
        const req = { body: { email: "a@b.com", answer: "a", newPassword: "newpw" } };
        const res = makeRes();

        mockUserModel.findOne.mockRejectedValueOnce(new Error("db error"));

        await forgotPasswordController(req, res);

        expect(logSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Something went wrong",
            error: expect.anything(),
          })
        );
      });
    });

    describe("testController", () => {
      // Assuming that testController / testRoute is a test endpoint that may be used by others for now
      // Avoiding infinite loops of errors?

      // added the test case, Daniel Lai, A0192327A
      it("should not send more messages after throwing an error", async () => {
        const mockReq = jest.fn();
        const testRes = {
          send: jest.fn().mockImplementation(() => {
            throw new Error("Send failed");
          })
        };
        jest.spyOn(console, 'log').mockImplementation(() => { });

        await testController(mockReq, testRes); // Act

        expect(testRes.send).toHaveBeenCalledWith("Protected Routes");
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
        expect(testRes.send).toHaveBeenCalledTimes(1);
      });

      // add test case, Song Yichao, A0255686M
      it("should send 'Protected Routes'", () => {
        const req = {};
        const res = makeRes();

        testController(req, res);

        expect(res.send).toHaveBeenCalledWith("Protected Routes");
      });

      // add test case, Song Yichao, A0255686M
      it("should hit catch branch when res.send throws (covers catch)", () => {
        const req = {};
        const res = makeRes();

        // First call throws (inside try), second call succeeds (inside catch)
        res.send.mockImplementationOnce(() => { throw new Error("send failed"); });

        testController(req, res);

        expect(logSpy).toHaveBeenCalled();
        expect(res.send).toHaveBeenCalledTimes(1);
        expect(res.send).toHaveBeenLastCalledWith("Protected Routes");
      });
    });
  });
});
