import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import { registerController, loginController } from "../controllers/authController.js";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware.js";

let mongo;
let originalJwtSecret;
let regularUser;
let adminUser;

const makeRes = () => {
  const res = {};
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

const registerUser = async ({ name, email, role = 0 }) => {
  const registerReq = {
    body: {
      name,
      email,
      password: "password123",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    },
  };
  const registerRes = makeRes();
  await registerController(registerReq, registerRes);

  if (role === 1) {
    await userModel.findOneAndUpdate({ email }, { role: 1 });
  }

  return userModel.findOne({ email });
};

const loginAndGetToken = async (email, password) => {
  // assumes user with given email and password already exists in database
  const loginReq = {
    body: {
      email,
      password,
    },
  };
  const loginRes = makeRes();
  await loginController(loginReq, loginRes);
  return loginRes.body.token;
};

describe("authMiddleware Integration Tests", () => {
  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "integration_test_secret";

    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await mongoose.model("users").syncIndexes();

    regularUser = await registerUser({
      name: "Regular User",
      email: "regular@example.com",
      role: 0,
    });
    adminUser = await registerUser({
      name: "Admin User",
      email: "admin@example.com",
      role: 1,
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe("requireSignIn", () => {
    // added the test case, Daniel Lai, A0192327A
    it("verifies a token issued by loginController and sets req.user", async () => {
      const req = {
        headers: {
          authorization: await loginAndGetToken("regular@example.com", "password123"),
        },
      };
      const next = jest.fn();

      await requireSignIn(req, null, next);

      expect(req.user).toEqual(
        expect.objectContaining({
          _id: regularUser._id.toString(),
        })
      );
      expect(next).toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it("rejects an expired token that was originally issued by loginController", async () => {
      const freshToken = await loginAndGetToken("regular@example.com", "password123");
      const decoded = JWT.decode(freshToken);
      const expiredToken = JWT.sign(
        { _id: decoded._id, iat: 1, exp: 1 },
        process.env.JWT_SECRET
      );

      const req = {
        headers: {
          authorization: expiredToken,
        },
      };
      const next = jest.fn();
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      await requireSignIn(req, null, next);

      expect(req.user).toBeUndefined();
      expect(next).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it("rejects a fake token", async () => {
      const req = {
        headers: {
          authorization: "invalid-token",
        },
      };
      const next = jest.fn();
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      await requireSignIn(req, null, next);

      expect(req.user).toBeUndefined();
      expect(next).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    // added the test case, Daniel Lai, A0192327A
    it("rejects a request from a non-admin user", async () => {
      const req = {
        user: {
          _id: regularUser._id,
        },
      };
      const res = makeRes();
      const next = jest.fn();

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Unauthorized Access",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it("grants access to an admin user", async () => {
      const req = {
        user: {
          _id: adminUser._id,
        },
      };
      const res = makeRes();
      const next = jest.fn();

      await isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it("rejects a request without req.user and returns middleware error", async () => {
      const req = {};
      const res = makeRes();
      const next = jest.fn();
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Error in admin middleware",
          error: expect.any(Error),
        })
      );
      expect(next).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it("blocks regular users in requireSignIn -> isAdmin middleware chain", async () => {
      const token = await loginAndGetToken("regular@example.com", "password123");
      const req = {
        headers: { authorization: token },
      };
      const res = makeRes();
      const signInNext = jest.fn();
      const finalNext = jest.fn();

      await requireSignIn(req, res, signInNext);
      await isAdmin(req, res, finalNext);

      expect(req.user).toEqual(
        expect.objectContaining({ _id: regularUser._id.toString() })
      );
      expect(signInNext).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(finalNext).not.toHaveBeenCalled();
    });

    // added the test case, Daniel Lai, A0192327A
    it("allows admin users in requireSignIn -> isAdmin middleware chain", async () => {
      const token = await loginAndGetToken("admin@example.com", "password123");
      const req = {
        headers: { authorization: token },
      };
      const res = makeRes();
      const signInNext = jest.fn();
      const finalNext = jest.fn();

      await requireSignIn(req, res, signInNext);
      await isAdmin(req, res, finalNext);

      expect(req.user).toEqual(
        expect.objectContaining({ _id: adminUser._id.toString() })
      );
      expect(signInNext).toHaveBeenCalled();
      expect(finalNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});