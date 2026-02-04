import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import CategoryProduct from "./CategoryProduct";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn() },
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("CategoryProduct", () => {
  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: "cat-slug" });
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([[{ _id: "cart1" }], jest.fn()]);
  });

  it("fetches products and category on mount", async () => {
    const data = {
      products: [
        {
          _id: "p1",
          name: "Prod1",
          price: 10,
          description: "Desc1",
          slug: "prod1",
        },
      ],
      category: { _id: "c1", name: "Cat1" },
    };
    axios.get.mockResolvedValueOnce({ data });
    render(<CategoryProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/cat-slug",
      );
    });
    const cat1 = await screen.findByText(/Category - Cat1/);
    const prod1 = await screen.findByText(/Prod1/);
    expect(cat1).toBeInTheDocument();
    expect(prod1).toBeInTheDocument();
  });

  it("handles no products", async () => {
    const data = { products: [], category: { _id: "c1", name: "Cat1" } };
    axios.get.mockResolvedValueOnce({ data });
    render(<CategoryProduct />);
    await waitFor(() => {
      expect(screen.getByText(/0 result found/)).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API error"));
    render(<CategoryProduct />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/cat-slug",
      );
    });
    // Should not throw, just log error
  });

  it("adds product to cart and shows toast", async () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([[{ _id: "cart1" }], setCart]);
    const prod = {
      _id: "p1",
      name: "Prod1",
      price: 10,
      description: "Desc1",
      slug: "prod1",
    };
    const data = { products: [prod], category: { _id: "c1", name: "Cat1" } };
    axios.get.mockResolvedValueOnce({ data });
    render(<CategoryProduct />);
    await waitFor(() => screen.getByText(/Prod1/));
    const addBtn = screen.getByText(/ADD TO CART/);
    addBtn.click();
    expect(setCart).toHaveBeenCalledWith([{ _id: "cart1" }, prod]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("navigates to product details for a product", async () => {
    const prod = {
      _id: "p1",
      name: "Prod1",
      price: 10,
      description: "Desc1",
      slug: "prod1",
    };
    const data = { products: [prod], category: { _id: "c1", name: "Cat1" } };
    axios.get.mockResolvedValueOnce({ data });
    render(<CategoryProduct />);
    await waitFor(() => screen.getByText(/Prod1/));
    const moreDetailsBtn = screen.getByText(/More Details/);
    moreDetailsBtn.click();
    expect(mockNavigate).toHaveBeenCalledWith("/product/prod1");
  });
});
