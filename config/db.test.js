// MANSOOR Syed Ali A0337939J

import mongoose from "mongoose";
import connectDB from "./db";
import "colors";

jest.mock("mongoose");

describe("connectDB", () => {
  const OLD_ENV = process.env;
  let logSpy;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, MONGO_URL: "mongodb://testurl" };
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = OLD_ENV;
    logSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("should connect to MongoDB and log success message", async () => {
    mongoose.connect.mockResolvedValue({
      connection: { host: "testhost" },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URL,
      expect.objectContaining({
        serverApi: expect.any(Object),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Connected To Mongodb Database testhost"),
    );
  });

  it("should log error message on connection failure", async () => {
    const error = new Error("Connection failed");
    mongoose.connect.mockRejectedValue(error);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URL,
      expect.objectContaining({
        serverApi: expect.any(Object),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in Mongodb Error: Connection failed"),
    );
  });
});
