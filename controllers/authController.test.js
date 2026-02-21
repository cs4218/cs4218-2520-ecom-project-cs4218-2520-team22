import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController
} from "./authController.js";
import { describe } from "node:test";
import jestBackendConfig from "../jest.backend.config.js";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("./../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("Auth Controller Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerController Function", () => {

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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      userModel.findOne.mockResolvedValue({ email: "existing@example.com" });

      await registerController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "existing@example.com" });
      expect(testRes.status).toHaveBeenCalledWith(200);
      expect(testRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Already registered, please login",
      });
      expect(hashPassword).not.toHaveBeenCalled();
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
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockRejectedValue(new Error("Hashing failed"));
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await registerController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(hashPassword).toHaveBeenCalledWith("password123");
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
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashedPassword123");

      const mockSave = jest.fn().mockRejectedValue(new Error("Database save failed"));
      userModel.mockImplementationOnce(() => ({ save: mockSave }));
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await registerController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(hashPassword).toHaveBeenCalledWith("password123");
      expect(userModel).toHaveBeenCalledWith({
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
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashedPassword123");

      const mockUser = { _id: "user123", name: "Test User", email: "test@example.com" };
      const mockSave = jest.fn().mockResolvedValue(mockUser);
      userModel.mockImplementationOnce(() => ({ save: mockSave }));

      await registerController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(hashPassword).toHaveBeenCalledWith("password123");
      expect(userModel).toHaveBeenCalledWith({
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
  });

  describe("loginController Function", () => {
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
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
      userModel.findOne.mockResolvedValue(null);

      await loginController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
      expect(testRes.status).toHaveBeenCalledWith(404);
      expect(testRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registered",
      });
      expect(comparePassword).not.toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A

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
      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      await loginController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(comparePassword).toHaveBeenCalledWith("wrongpassword", "hashedPassword123");
      expect(testRes.status).toHaveBeenCalledWith(200);
      expect(testRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
      expect(JWT.sign).not.toHaveBeenCalled();
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
      userModel.findOne.mockRejectedValue(new Error("Database connection failed"));
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await loginController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
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
      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockResolvedValue(mockToken);

      await loginController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(comparePassword).toHaveBeenCalledWith("password123", "hashedPassword123");
      expect(JWT.sign).toHaveBeenCalledWith(
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
  });

  describe("forgotPasswordController Function", () => {
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      expect(userModel.findOne).not.toHaveBeenCalled();
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
      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
        answer: "wrong answer"
      });
      expect(testRes.status).toHaveBeenCalledWith(404);
      expect(testRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Wrong Email Or Answer",
      });
      expect(hashPassword).not.toHaveBeenCalled();
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
      userModel.findOne.mockResolvedValue(mockUser);
      hashPassword.mockRejectedValue(new Error("Hashing failed"));
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await forgotPasswordController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
        answer: "security answer"
      });
      expect(hashPassword).toHaveBeenCalledWith("newpassword123");
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
      userModel.findOne.mockRejectedValue(new Error("Database connection failed"));
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await forgotPasswordController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({
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
      userModel.findOne.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue("hashedNewPassword123");
      userModel.findByIdAndUpdate.mockRejectedValue(new Error("Database update failed"));
      jest.spyOn(console, 'log').mockImplementation(() => { });

      await forgotPasswordController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
        answer: "security answer"
      });
      expect(hashPassword).toHaveBeenCalledWith("newpassword123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
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
      userModel.findOne.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue("hashedNewPassword123");
      userModel.findByIdAndUpdate.mockResolvedValue(null);

      await forgotPasswordController(testReq, testRes); // Act

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
        answer: "security answer"
      });
      expect(hashPassword).toHaveBeenCalledWith("newpassword123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        password: "hashedNewPassword123"
      });
      expect(testRes.status).toHaveBeenCalledWith(200);
      expect(testRes.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });
  });

  // Assuming that testController / testRoute is a test endpoint that may be used by others for now
  describe("testController Function", () => {
    // Avoiding infinite loops of errors?
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
  });
});