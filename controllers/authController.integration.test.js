import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  registerController,
  loginController,
  forgotPasswordController,
  updateProfileController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import { comparePassword } from "../helpers/authHelper.js";

let mongo;
let originalJwtSecret;

const makeRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.send = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

// overall, not verifying the user, token or error details in what is returned
// because those are checked in other layers of testing and thus redundant
describe("authController Integration Tests", () => {
  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "integration_test_secret";
    
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await mongoose.model("users").syncIndexes();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe("just registerController", () => {
    // added the test case, Daniel Lai, A0192327A
    it("registers a user successfully", async () => {
      const registerReq = {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "12345678",
          address: "Singapore",
          answer: "blue",
        },
      };
      const registerRes = makeRes();

      await registerController(registerReq, registerRes);

      expect(registerRes.status).toHaveBeenCalledWith(201);
      expect(registerRes.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "User registered successfully",
        })
      );
    });

    // other negative test scenarios covered in authController.test.js already
    // added the test case, Daniel Lai, A0192327A
    it("does not allow registration with an email that is already registered", async () => {
      const registerReq = {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "12345678",
          address: "Singapore",
          answer: "blue",
        },
      };
      const registerRes = makeRes();
      await registerController(registerReq, registerRes);

      const registerReq2 = {
        body: {
          name: "Test User 2",
          email: "test@example.com",
          password: "password12",
          phone: "23456789",
          address: "China",
          answer: "yellow",
        },
      };
      const registerRes2 = makeRes();

      await registerController(registerReq2, registerRes2);

      expect(registerRes2.status).toHaveBeenCalledWith(200);
      expect(registerRes2.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Already registered, please login",
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("allows registration with the same name but different email", async () => {
      const registerReq = {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "12345678",
          address: "Singapore",
          answer: "blue",
        },
      };
      const registerRes = makeRes();
      await registerController(registerReq, registerRes);

      const registerReq2 = {
        body: {
          name: "Test User",
          email: "test2@example.com",
          password: "password123",
          phone: "12345678",
          address: "Singapore",
          answer: "blue",
        },
      };
      const registerRes2 = makeRes();

      await registerController(registerReq2, registerRes2);

      expect(registerRes2.status).toHaveBeenCalledWith(201);
      expect(registerRes2.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "User registered successfully",
        })
      );
    });
  });

  describe("just loginController", () => {
    // added the test case, Daniel Lai, A0192327A
    it("fails to login with unregistered email", async () => {
      const loginReq = {
        body: {
          email: "unregistered@example.com",
          password: "password123",
        },
      };
      const loginRes = makeRes();

      await loginController(loginReq, loginRes);

      expect(loginRes.status).toHaveBeenCalledWith(404);
      expect(loginRes.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Email is not registered",
        })
      );
    });
  });

  describe("just forgotPasswordController", () => {
    // added the test case, Daniel Lai, A0192327A
    it("fails to reset password of user that doesn't exist", async () => {
      const forgotReq = {
        body: {
          email: "test@example.com",
          answer: "blue",
          newPassword: "newPassword123",
        },
      };
      const forgotRes = makeRes();

      await forgotPasswordController(forgotReq, forgotRes);

      expect(forgotRes.status).toHaveBeenCalledWith(404);
      expect(forgotRes.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Wrong Email Or Answer",
        })
      );
    });
  });

  describe("mixed scenarios after registration", () => {
    beforeEach(async () => {
      const registerReq = {
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "12345678",
          address: "Singapore",
          answer: "blue",
        },
      };
      const registerRes = makeRes();

      await registerController(registerReq, registerRes);
    });

    // added the test case, Daniel Lai, A0192327A
    it("registers then logs in successfully", async () => {
      const loginReq = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };
      const loginRes = makeRes();

      await loginController(loginReq, loginRes);

      expect(loginRes.status).toHaveBeenCalledWith(200);
      expect(loginRes.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Logged in successfully",
          token: expect.any(String), // details cannot be verified easily, but they must exist
        })
      );
      expect(loginRes.body.user).toEqual(
        expect.objectContaining({
          email: "test@example.com",
          name: "Test User",
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("registers then fails to login with wrong password", async () => {
      const loginReq = {
        body: {
          email: "test@example.com",
          password: "wrongpassword",
        },
      };
      const loginRes = makeRes();

      await loginController(loginReq, loginRes);

      expect(loginRes.status).toHaveBeenCalledWith(200);
      expect(loginRes.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Invalid Password",
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("resets password successfully", async () => {
      const forgotReq = {
        body: {
          email: "test@example.com",
          answer: "blue",
          newPassword: "newPassword123",
        },
      };
      const forgotRes = makeRes();

      await forgotPasswordController(forgotReq, forgotRes);

      expect(forgotRes.status).toHaveBeenCalledWith(200);
      expect(forgotRes.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Password Reset Successfully",
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("fails to reset password with wrong answer", async () => {
      const forgotReq = {
        body: {
          email: "test@example.com",
          answer: "wronganswer",
          newPassword: "newPassword123",
        },
      };
      const forgotRes = makeRes();

      await forgotPasswordController(forgotReq, forgotRes);

      expect(forgotRes.status).toHaveBeenCalledWith(404);
      expect(forgotRes.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Wrong Email Or Answer",
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("fails to reset password with wrong answer and then fails to login with new password", async () => {
      const forgotReq = {
        body: {
          email: "test@example.com",
          answer: "wronganswer",
          newPassword: "newPassword123",
        },
      };
      const forgotRes = makeRes();
      await forgotPasswordController(forgotReq, forgotRes);

      const loginReq = {
        body: {
          email: "test@example.com",
          password: "newPassword123",
        },
      };
      const loginRes = makeRes();

      await loginController(loginReq, loginRes);

      expect(loginRes.status).toHaveBeenCalledWith(200);
      expect(loginRes.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Invalid Password",
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("fails to reset password with wrong answer and then logs in with old password", async () => {
      const forgotReq = {
        body: {
          email: "test@example.com",
          answer: "wronganswer",
          newPassword: "newPassword123",
        },
      };
      const forgotRes = makeRes();
      await forgotPasswordController(forgotReq, forgotRes);

      const loginReq = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };
      const loginRes = makeRes();

      await loginController(loginReq, loginRes);

      expect(loginRes.status).toHaveBeenCalledWith(200);
      expect(loginRes.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Logged in successfully",
          token: expect.any(String),
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("resets password and allows login with the new password", async () => {
      const forgotReq = {
        body: {
          email: "test@example.com",
          answer: "blue",
          newPassword: "newPassword123",
        },
      };
      const forgotRes = makeRes();
      await forgotPasswordController(forgotReq, forgotRes);

      const newLoginReq = {
        body: {
          email: "test@example.com",
          password: "newPassword123",
        },
      };
      const newLoginRes = makeRes();

      await loginController(newLoginReq, newLoginRes);

      expect(newLoginRes.status).toHaveBeenCalledWith(200);
      expect(newLoginRes.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Logged in successfully",
          token: expect.any(String),
        })
      );
    });

    // added the test case, Daniel Lai, A0192327A
    it("resets password and does not allow login with the old password", async () => {
      const forgotReq = {
        body: {
          email: "test@example.com",
          answer: "blue",
          newPassword: "newPassword123",
        },
      };
      const forgotRes = makeRes();
      await forgotPasswordController(forgotReq, forgotRes);

      const oldLoginReq = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };
      const oldLoginRes = makeRes();

      await loginController(oldLoginReq, oldLoginRes);

      expect(oldLoginRes.status).toHaveBeenCalledWith(200);
      expect(oldLoginRes.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Invalid Password",
        })
      );
    });

    // written to cover uncovered line in authController's updateProfileController
    // otherwise ignoring other tests for updateProfileController as out of scope
    // added the test case, Daniel Lai, A0192327A
    it("should update all details of a user successfully (except for email!) if provided", async () => {
      const existingUser = await userModel.findOne({ email: "test@example.com" });
      const updateReq = {
        user: {
          _id: existingUser._id,
        },
        body: {
          name: "Updated Test User",
          email: "updated@example.com",
          password: "updatedPassword123",
          phone: "87654321",
          address: "Updated Address",
        },
      };
      const updateRes = makeRes();

      await updateProfileController(updateReq, updateRes);
      const savedUser = await userModel.findById(existingUser._id);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(updateRes.body).toEqual(
        expect.objectContaining({
          success: true,
          message: "Profile Updated Successfully",
        })
      );
      const updatedUser = updateRes.body.updatedUser;
      expect(updatedUser).toBeDefined();
      expect(updatedUser._id.toString()).toBe(existingUser._id.toString());
      expect(updatedUser.name).toBe("Updated Test User");
      expect(updatedUser.phone).toBe("87654321");
      expect(updatedUser.address).toBe("Updated Address");
      expect(updatedUser.email).toBe("test@example.com");
      expect(savedUser.name).toBe("Updated Test User");
      expect(savedUser.phone).toBe("87654321");
      expect(savedUser.address).toBe("Updated Address");
      expect(savedUser.email).toBe("test@example.com");
      expect(savedUser.password).not.toBe("updatedPassword123");
      expect(await comparePassword("updatedPassword123", savedUser.password)).toBe(true);
    });
  });
});
