import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: {
      type: [
        {
          type: mongoose.ObjectId,
          ref: "Products",
          required: true,
        }
      ],
      validate: [(val) => val.length > 0, "At least one product is required"],
      required: true,
    },

    payment: {},

    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
    },

    status: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
