import mongoose from "mongoose";

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, clientOptions);
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white,
    );
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
