// Written By QINZHE Wang A0337880U
import JWT from "jsonwebtoken";
import { hashPassword } from "../../helpers/authHelper.js";
import userModel from "../../models/userModel.js";

export const createUser = async (overrides = {}) => {
  const rawPassword = overrides.password || "password123";
  const hashedPassword = await hashPassword(rawPassword);
  const { password: _ignored, ...rest } = overrides;
  return userModel.create({
    name: "Test User",
    email: "user@test.com",
    phone: "1234567890",
    address: "123 Test St",
    answer: "testanswer",
    role: 0,
    ...rest,
    password: hashedPassword,
  });
};

export const createAdmin = async (overrides = {}) => {
  return createUser({
    name: "Admin User",
    email: "admin@test.com",
    role: 1,
    ...overrides,
  });
};

export const tokenFor = (user) => {
  return JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
