import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

jest.mock('bcrypt');

describe("authHelper Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword Function", () => {
    // added the test case, Daniel Lai, A0192327A
    // Most of the tests should be handled at the integration testing level, except for error handling in hashPassword
    // Since this is a wrapper around a external dependency
    it("should handle bcrypt.hash errors gracefully", async () => {
      const mockError = new Error("Bcrypt hashing failed");
      bcrypt.hash.mockRejectedValue(mockError);
      jest.spyOn(console, 'log').mockImplementation(() => { });

      const result = await hashPassword("testpassword"); // Act

      expect(console.log).toHaveBeenCalledWith(mockError);
      expect(result).toBeUndefined();
    });
  });
});