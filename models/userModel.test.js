// Song Yichao, A0255686M

import mongoose from "mongoose";
import userModel from "./userModel.js";

describe("User Model Unit Tests", () => {

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // add test case, Song Yichao, A0255686M
  it("should require name field", () => {
    const user = new userModel({
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue"
    });

    const error = user.validateSync();
    expect(error.errors.name).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should require email field", () => {
    const user = new userModel({
      name: "Test",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue"
    });

    const error = user.validateSync();
    expect(error.errors.email).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should require password field", () => {
    const user = new userModel({
      name: "Test",
      email: "test@test.com",
      phone: "12345678",
      address: "Singapore",
      answer: "blue"
    });

    const error = user.validateSync();
    expect(error.errors.password).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should require phone field", () => {
    const user = new userModel({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      address: "Singapore",
      answer: "blue"
    });

    const error = user.validateSync();
    expect(error.errors.phone).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should require address field", () => {
    const user = new userModel({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      answer: "blue"
    });

    const error = user.validateSync();
    expect(error.errors.address).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should require answer field", () => {
    const user = new userModel({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore"
    });

    const error = user.validateSync();
    expect(error.errors.answer).toBeDefined();
  });

  // add test case, Song Yichao, A0255686M
  it("should default role to 0", () => {
    const user = new userModel({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue"
    });

    expect(user.role).toBe(0);
  });

  // added the test case, Daniel Lai, A0192327A
  it("should allow role to be set to 1", () => {
    const user = new userModel({
      name: "Test",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
      role: 1
    });

    expect(user.role).toBe(1);
  });

  // added the test case, Daniel Lai, A0192327A
  it("should trim name field", () => {
    const user = new userModel({
      name: "    Test    ",
      email: "test@test.com",
      password: "123456",
      phone: "12345678",
      address: "Singapore",
      answer: "blue",
    });

    expect(user.name).toBe("Test");
  });

  // add test case, Song Yichao, A0255686M
  it("should mark email as unique in schema", () => {
    const emailPath = userModel.schema.path("email");
    expect(emailPath.options.unique).toBe(true);
  });

});
