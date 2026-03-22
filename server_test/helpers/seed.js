// QINZHE Wang, A0337880U
import slugify from "slugify";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import orderModel from "../../models/orderModel.js";

export const createCategory = async (overrides = {}) => {
  const name = overrides.name || "Test Category";
  return categoryModel.create({
    name,
    slug: slugify(name),
    ...overrides,
  });
};

export const createProduct = async (categoryId, overrides = {}) => {
  const name = overrides.name || "Test Product";
  return productModel.create({
    name,
    slug: slugify(name),
    description: overrides.description || "Test description",
    price: overrides.price !== undefined ? overrides.price : 99,
    category: categoryId,
    quantity: overrides.quantity !== undefined ? overrides.quantity : 10,
    shipping: overrides.shipping !== undefined ? overrides.shipping : true,
    ...overrides,
  });
};

export const createOrder = async (buyerId, products, overrides = {}) => {
  return orderModel.create({
    products,
    payment: { success: true },
    buyer: buyerId,
    status: "Not Processed",
    ...overrides,
  });
};
