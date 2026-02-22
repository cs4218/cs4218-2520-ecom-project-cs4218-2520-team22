import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Auth Middleware Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requireSignIn Function", () => {
    const mockNext = jest.fn();

    // added the test case, Daniel Lai, A0192327A
    it("should set req.user and call next() if token is valid", async () => {
      var testReq = {
        headers: {
          authorization: "valid-token",
        },
        user: null,
      };
      JWT.verify.mockReturnValue({ user: "user" });

      await requireSignIn(testReq, null, mockNext);
      expect(JWT.verify).toHaveBeenCalledWith(
        "valid-token",
        process.env.JWT_SECRET
      );
      expect(testReq.user).toEqual({ user: "user" });
      expect(mockNext).toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it("should log error if token is invalid", async () => {
      var testReq = {
        headers: {
          authorization: "invalid-token",
        },
        user: null,
      };
      JWT.verify.mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await requireSignIn(testReq, null, mockNext);
      expect(JWT.verify).toHaveBeenCalledWith(
        "invalid-token",
        process.env.JWT_SECRET
      );
      expect(testReq.user).toBeNull();
      expect(mockNext).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe("isAdmin Function", () => {
    // added the test case, Daniel Lai, A0192327A
    it('should call next() if user is admin', async () => {
      const testReq = { user: { _id: "user-id" } };
      const mockNext = jest.fn();
      userModel.findById.mockResolvedValue({ role: 1 });

      await isAdmin(testReq, null, mockNext); // Act

      expect(userModel.findById).toHaveBeenCalledWith("user-id");
      expect(mockNext).toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it('should return 401 if user is not admin', async () => {
      const testReq = { user: { _id: "user-id" } };
      const testRes = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const mockNext = jest.fn();
      userModel.findById.mockResolvedValue({ role: 0 });

      await isAdmin(testReq, testRes, mockNext); // Act

      expect(userModel.findById).toHaveBeenCalledWith("user-id");
      expect(testRes.status).toHaveBeenCalledWith(401);
      expect(testRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized Access",
      });
    });

    // added the test case, Daniel Lai, A0192327A
    it('should log error and return 401 if there is an error', async () => {
      const testReq = { user: { _id: "user-id" } };
      const testRes = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const mockNext = jest.fn();
      const mockError = new Error("Database error");
      userModel.findById.mockRejectedValue(mockError);
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await isAdmin(testReq, testRes, mockNext); // Act

      expect(userModel.findById).toHaveBeenCalledWith("user-id");
      expect(testRes.status).toHaveBeenCalledWith(401);
      expect(testRes.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error in admin middleware",
      });
      expect(console.log).toHaveBeenCalledWith(mockError);
    });
  });
});