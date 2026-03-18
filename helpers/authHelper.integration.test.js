import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

describe("authHelper sanity check external libraries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // added the test case, Daniel Lai, A0192327A
  it("hash should not return plaintext, and should compare consistently with the same plaintext", async () => {
    const plainPassword = "mysecretpassword";
    const hashedPassword = await hashPassword(plainPassword);

    const isMatch = await comparePassword(plainPassword, hashedPassword);

    expect(plainPassword).not.toBe(hashedPassword); // Ensure hashing is working
    expect(isMatch).toBe(true);
  });

  // added the test case, Daniel Lai, A0192327A
  it("comparePassword should return false for different plaintexts", async () => {
    const plainPassword = "mysecretpassword";
    const differentPassword = "anotherpassword";
    const hashedPassword = await hashPassword(plainPassword);

    const isMatch = await comparePassword(differentPassword, hashedPassword);

    expect(isMatch).toBe(false);
  });
});