
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "./userModel";

let mongo

describe("User Model Integration Tests", () => {
  beforeAll(async () => {
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
  });

  // added test case, Daniel Lai, A0192327A
  it("it adds a user to database with default role of 0", async () => {
    const user = new User({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue"
    });

    const saved = await user.save();

    expect(saved.name).toBe("Test");
    expect(saved.email).toBe("test@test.com");
    expect(saved.password).toBe("123456");
    expect(saved.phone).toBe("12345678");
    expect(saved.address).toBe("Singapore");
    expect(saved.answer).toBe("blue");
    expect(saved.role).toBe(0);
  });

  // added test case, Daniel Lai, A0192327A
  it("it adds a user to database with role of 1 if specified", async () => {
    const user = new User({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
      role: 1
    });

    const saved = await user.save();

    expect(saved.name).toBe("Test");
    expect(saved.email).toBe("test@test.com");
    expect(saved.password).toBe("123456");
    expect(saved.phone).toBe("12345678");
    expect(saved.address).toBe("Singapore");
    expect(saved.answer).toBe("blue");
    expect(saved.role).toBe(1);
  });

  // not testing rejecting missing fields because it seems redundant with unit tests
  // added test case, Daniel Lai, A0192327A
  it("should reject user with duplicate email", async () => {
    await User.create({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });
    const user2 = new User({
      name: "Testing",
      email: "test@test.com",
      password: "1234567",
      phone: "23456789",
      address: "USA",
      answer: "yellow",
      role: 1
    });

    await expect(user2.save()).rejects.toThrow(/duplicate key/);
  });

  // added test case, Daniel Lai, A0192327A
  it("should allow multiple users with same name but different email", async () => {
    await User.create({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });
    const user2 = new User({
      name: "Test",
      email: "test2@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });

    await expect(user2.save()).resolves.toBeDefined();
  });

  // in a way this set of cases can be viewed as library sanity checks
  // added test case, Daniel Lai, A0192327A
  it("should be able to find user by email and answer after registration", async () => {
    await User.create({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });

    const foundUser = await User.findOne({ email: "test@test.com", answer: "blue" });

    expect(foundUser).toBeDefined();
    expect(foundUser.name).toBe("Test");
  });

  // added test case, Daniel Lai, A0192327A
  it("should not be able to find user by email that does not exist", async () => {
    await User.create({
      name: "Test",
      email: "test2@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });

    const foundUser = await User.findOne({ email: "test@test.com", answer: "blue" });

    expect(foundUser).toBeNull();
  });

  // added test case, Daniel Lai, A0192327A
  it("should not be able to find user by correct email but wrong answer", async () => {
    await User.create({
      name: "Test",
      email: "test2@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });

    const foundUser = await User.findOne({ email: "test@test.com", answer: "yellow" });

    expect(foundUser).toBeNull();
  });

  // negative cases for reset password already covered above
  // added test case, Daniel Lai, A0192327A
  it("should be able to reset password of specified user", async () => {
    await User.create({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });
    const user = await User.findOne({ email: "test@test.com", answer: "blue" });

    await User.findByIdAndUpdate(user._id, { password: "234567" });

    await expect(User.findOne({ email: "test@test.com", answer: "blue" })).resolves.toHaveProperty("password", "234567");
    await expect(User.findOne({ email: "test@test.com", answer: "blue" })).resolves.not.toHaveProperty("password", "123456");
  });

  // added test case, Daniel Lai, A0192327A
  it("should be able to find user by id", async () => {
    await User.create({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });
    const user = await User.findOne({ email: "test@test.com", answer: "blue" });

    const foundUser = await User.findById(user._id);

    expect(foundUser).toBeDefined();
    expect(foundUser.name).toBe("Test");
  });

  // added test case, Daniel Lai, A0192327A
  it("returns null when finding a user by a non-existent id", async () => {
    const missingUserId = new mongoose.Types.ObjectId();

    const missingUser = await User.findById(missingUserId);

    expect(missingUser).toBeNull();
  });
});
