import mongoose from "mongoose";
import "colors";

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};
const connectDB = async () => {
  try {
    // Use dedicated e2e test database if running e2e tests
    const mongoUrl = process.env.E2E_MODE === "true" ? process.env.MONGO_TEST_URL : process.env.MONGO_URL;
    const conn = await mongoose.connect(mongoUrl, clientOptions);
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white,
    );
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
