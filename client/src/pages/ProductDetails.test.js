// MANSOOR Syed Ali A0337939J

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useCart } from "../context/cart";
import ProductDetails from "./ProductDetails";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn() },
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("./../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("ProductDetails", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: "test-slug" });
    useNavigate.mockReturnValue(mockNavigate);
    useCart.mockReturnValue([[{ _id: "cart1" }], jest.fn()]);
  });

  it("fetches product and related products on mount", async () => {
    const productData = {
      product: {
        _id: "p1",
        name: "Test Product",
        description: "Desc",
        price: 100,
        category: { _id: "c1", name: "Cat1" },
      },
    };

    const relatedData = {
      products: [
        {
          _id: "p2",
          name: "RelProd",
          price: 50,
          description: "RelDesc",
          slug: "relprod",
          category: { _id: "c1", name: "Cat1" },
        },
      ],
    };

    axios.get
      .mockResolvedValueOnce({ data: productData })
      .mockResolvedValueOnce({ data: relatedData });

    await act(async () => {
      render(<ProductDetails />);
    });

    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/get-product/test-slug");
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/related-product/p1/c1");

    expect(screen.getByText(/Test Product/)).toBeInTheDocument();
    expect(screen.getByText(/RelProd/)).toBeInTheDocument();
  });

  it("handles no related products", async () => {
    const productData = {
      product: {
        _id: "p1",
        name: "Test Product",
        description: "Desc",
        price: 100,
        category: { _id: "c1", name: "Cat1" },
      },
    };

    axios.get
      .mockResolvedValueOnce({ data: productData })
      .mockResolvedValueOnce({ data: { products: [] } });

    await act(async () => {
      render(<ProductDetails />);
    });

    expect(screen.getByText(/No Similar Products found/)).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API error"));
    jest.spyOn(console, "log").mockImplementation(() => { });

    await act(async () => {
      render(<ProductDetails />);
    });

    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/get-product/test-slug");
    expect(console.log).toHaveBeenCalledWith(
      new Error("API error"));
  });

  it("adds related product to cart and shows toast", async () => {
    const setCart = jest.fn();
    useCart.mockReturnValue([[{ _id: "cart1" }], setCart]);

    const productData = {
      product: {
        _id: "p1",
        name: "Test Product",
        description: "Desc",
        price: 100,
        category: { _id: "c1", name: "Cat1" },
      },
    };

    const relatedProduct = {
      _id: "p2",
      name: "RelProd",
      price: 50,
      description: "RelDesc",
      slug: "relprod",
      category: { _id: "c1", name: "Cat1" },
    };

    axios.get
      .mockResolvedValueOnce({ data: productData })
      .mockResolvedValueOnce({ data: { products: [relatedProduct] } });

    await act(async () => {
      render(<ProductDetails />);
    });
    screen.getByText(/RelProd/);

    const addBtn = screen.getAllByText(/ADD TO CART/)[1];
    await act(async () => {
      addBtn.click();
    });

    expect(setCart).toHaveBeenCalledWith([{ _id: "cart1" }, relatedProduct]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("navigates to product details for related product", async () => {
    const productData = {
      product: {
        _id: "p1",
        name: "Test Product",
        description: "Desc",
        price: 100,
        category: { _id: "c1", name: "Cat1" },
      },
    };

    const relatedProduct = {
      _id: "p2",
      name: "RelProd",
      price: 50,
      description: "RelDesc",
      slug: "relprod",
      category: { _id: "c1", name: "Cat1" },
    };

    axios.get
      .mockResolvedValueOnce({ data: productData })
      .mockResolvedValueOnce({ data: { products: [relatedProduct] } });

    await act(async () => {
      render(<ProductDetails />);
    });

    screen.getByText(/RelProd/);

    const moreDetailsBtn = screen.getByText(/More Details/);
    await act(async () => {
      moreDetailsBtn.click();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/product/relprod");
  });

  it("doesn't fetch product when slug is missing", async () => {
    useParams.mockReturnValue({});

    await act(async () => {
      render(<ProductDetails />);
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("logs error when fetching similar products fails", async () => {
    jest.spyOn(console, "log").mockImplementation(() => { });

    const productData = {
      product: {
        _id: "p1",
        name: "Test Product",
        description: "Desc",
        price: 100,
        category: { _id: "c1", name: "Cat1" },
      },
    };

    axios.get
      .mockResolvedValueOnce({ data: productData })
      .mockRejectedValueOnce(new Error("API error"));

    await act(async () => {
      render(<ProductDetails />);
    });

    expect(console.log).toHaveBeenCalledWith(new Error("API error"));
  });
});
