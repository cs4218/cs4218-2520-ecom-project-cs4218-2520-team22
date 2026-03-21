// QINZHE Wang, A0337880U
import express from "express";
import cors from "cors";
import authRoutes from "../../routes/authRoute.js";
import categoryRoutes from "../../routes/categoryRoutes.js";
import productRoutes from "../../routes/productRoutes.js";

const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/category", categoryRoutes);
  app.use("/api/v1/product", productRoutes);
  return app;
};

export default createApp;
