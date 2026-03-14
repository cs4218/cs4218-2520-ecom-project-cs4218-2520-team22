import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";
import { before } from "node:test";

describe("authHelper Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock('bcrypt')
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

  describe("Integration Testing", () => {
    beforeEach(() => {
      jest.unmock('bcrypt');
    });
    
    it("hash should not return plaintext, and should compare consistently with the same plaintext", async () => {
      const plainPassword = "mysecretpassword";
      const hashedPassword = await hashPassword(plainPassword);
      
      const isMatch = await comparePassword(plainPassword, hashedPassword);
      
      expect(plainPassword).not.toBe(hashedPassword); // Ensure hashing is working
      expect(isMatch).toBe(true);
    });

    it("comparePassword should return false for different plaintexts", async () => {
      const plainPassword = "mysecretpassword";
      const differentPassword = "anotherpassword";
      const hashedPassword = await hashPassword(plainPassword);
      
      const isMatch = await comparePassword(differentPassword, hashedPassword); 
      
      expect(isMatch).toBe(false);
    });
  });
});