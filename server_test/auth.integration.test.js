// written by Mark Wang, A0337880U
import request from "supertest";
import { connect, disconnect, clearCollections } from "./helpers/db.js";
import { createUser, createAdmin, tokenFor } from "./helpers/auth.js";
import createApp from "./helpers/testApp.js";
import userModel from "../models/userModel.js";

const app = createApp();

const validUser = {
  name: "Jane Doe",
  email: "jane@example.com",
  password: "password123",
  phone: "9876543210",
  address: "456 Main St",
  answer: "blueanswer",
};

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

afterEach(async () => {
  await clearCollections();
});

// ─── Registration ────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/register", () => {
  it("AUTH-INT-01 registers with valid data and persists user in DB", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(validUser.email);

    const inDb = await userModel.findOne({ email: validUser.email });
    expect(inDb).not.toBeNull();
  });

  it("AUTH-INT-02 returns error and does not duplicate an existing email", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validUser);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);

    const count = await userModel.countDocuments({ email: validUser.email });
    expect(count).toBe(1);
  });

  it("AUTH-INT-03 returns error when name is missing", async () => {
    const { name: _n, ...noName } = validUser;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(noName);

    expect(res.body.error || res.body.message).toMatch(/name/i);
  });

  it("AUTH-INT-03 returns error when email is missing", async () => {
    const { email: _e, ...noEmail } = validUser;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(noEmail);

    expect(res.body.message).toMatch(/email/i);
  });

  it("AUTH-INT-03 returns error when password is missing", async () => {
    const { password: _p, ...noPass } = validUser;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(noPass);

    expect(res.body.message).toMatch(/password/i);
  });

  it("AUTH-INT-03 returns error when phone is missing", async () => {
    const { phone: _ph, ...noPhone } = validUser;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(noPhone);

    expect(res.body.message).toMatch(/phone/i);
  });

  it("AUTH-INT-03 returns error when address is missing", async () => {
    const { address: _a, ...noAddr } = validUser;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(noAddr);

    expect(res.body.message).toMatch(/address/i);
  });

  it("AUTH-INT-03 returns error when answer is missing", async () => {
    const { answer: _ans, ...noAns } = validUser;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(noAns);

    expect(res.body.message).toMatch(/answer/i);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
  });

  it("AUTH-INT-04 returns a JWT token on valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validUser.email);
  });

  it("AUTH-INT-05 returns error on wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: "wrongpassword" });

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid password/i);
  });

  it("AUTH-INT-06 returns 404 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@nowhere.com", password: "password123" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("AUTH-INT-04 login without email/password returns 404", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── Protected routes ────────────────────────────────────────────────────────

describe("GET /api/v1/auth/user-auth", () => {
  it("AUTH-INT-07 returns ok with a valid user token", async () => {
    const user = await createUser();
    const token = tokenFor(user);

    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("AUTH-INT-08 returns 401 when no token is provided (bug fixed)", async () => {
    const res = await request(app).get("/api/v1/auth/user-auth");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/auth/admin-auth", () => {
  it("AUTH-INT-09 returns ok with a valid admin token", async () => {
    const admin = await createAdmin();
    const token = tokenFor(admin);

    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("AUTH-INT-10 returns 401 when a regular user token is used", async () => {
    const user = await createUser();
    const token = tokenFor(user);

    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", token);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── Update Profile ───────────────────────────────────────────────────────────

describe("PUT /api/v1/auth/profile", () => {
  it("PROF-INT-01 updates profile fields and persists changes", async () => {
    const user = await createUser();
    const token = tokenFor(user);

    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", token)
      .send({ name: "Updated Name", phone: "0000000000" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedUser.name).toBe("Updated Name");

    const inDb = await userModel.findById(user._id);
    expect(inDb.name).toBe("Updated Name");
    expect(inDb.phone).toBe("0000000000");
  });

  it("PROF-INT-02 returns 401 when no token is provided (bug fixed)", async () => {
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .send({ name: "Ghost" });
    expect(res.status).toBe(401);
  });

  it("PROF-INT-03 rejects a new password shorter than 6 characters", async () => {
    const user = await createUser();
    const token = tokenFor(user);

    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", token)
      .send({ password: "abc" });

    expect(res.body.error).toMatch(/password/i);
  });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

describe("POST /api/v1/auth/forgot-password", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
  });

  it("FP-INT-01 resets password when email and answer match", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: validUser.email,
        answer: validUser.answer,
        newPassword: "newpassword456",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm new password works for login
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: "newpassword456" });

    expect(loginRes.body.success).toBe(true);
  });

  it("FP-INT-02 returns 404 when answer is wrong", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: validUser.email,
        answer: "wronganswer",
        newPassword: "newpassword456",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("FP-INT-03 returns 404 for a non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: "ghost@example.com",
        answer: validUser.answer,
        newPassword: "newpassword456",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
