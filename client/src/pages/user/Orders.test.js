// Song Yichao, A0255686M

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Orders from "./Orders";

// mock axios
jest.mock("axios");

// mock Layout to isolate Orders
jest.mock("./../../components/Layout", () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// mock UserMenu
jest.mock("../../components/UserMenu", () => {
  return function UserMenuMock() {
    return <div data-testid="user-menu">user-menu</div>;
  };
});

// mock moment so date output is stable
jest.mock("moment", () => {
  return () => ({
    fromNow: () => "some time ago",
  });
});

// mock useAuth
const mockUseAuth = jest.fn();
jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Orders page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // add test case, Song Yichao, A0255686M
  it("does not fetch orders when token is missing", async () => {
    mockUseAuth.mockReturnValue([{}, jest.fn()]);

    render(<Orders />);

    expect(screen.getByText(/all orders/i)).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  // add test case, Song Yichao, A0255686M
  it("fetches orders and renders order + product details when token exists", async () => {
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "o1",
          status: "Processing",
          buyer: { name: "Alice" },
          createdAt: "2024-01-01T00:00:00.000Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "Product 1",
              description: "This is a long description for product 1",
              price: 10,
            },
          ],
        },
      ],
    });

    render(<Orders />);

    expect(await screen.findByText("Processing")).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    // order info
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("some time ago")).toBeInTheDocument();

    // product info
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Price : 10")).toBeInTheDocument();
    expect(screen.getByAltText("Product 1")).toBeInTheDocument();

    // description is substring(0, 30)
    expect(
      screen.getByText("This is a long description for")
    ).toBeInTheDocument();

    // image alt uses product name
    expect(screen.getByAltText("Product 1")).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("logs error if fetching orders fails and does not crash", async () => {
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("network"));

    render(<Orders />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    expect(logSpy).toHaveBeenCalled();

    expect(screen.getByText(/all orders/i)).toBeInTheDocument();

    logSpy.mockRestore();
  });

  // add test case, Song Yichao, A0255686M
  it('renders "Failed" when payment.success is false', async () => {
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({
        data: [
        {
            _id: "o2",
            status: "Shipped",
            buyer: { name: "Bob" },
            createdAt: "2024-01-01T00:00:00.000Z",
            payment: { success: false },
            products: [],
        },
        ],
    });

    render(<Orders />);

    expect(await screen.findByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    // quantity should be 0
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("renders no product cards when an order has zero products", async () => {
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({
        data: [
        {
            _id: "o3",
            status: "Delivered",
            buyer: { name: "Carol" },
            createdAt: "2024-01-01T00:00:00.000Z",
            payment: { success: true },
            products: [],
        },
        ],
    });

    render(<Orders />);

    expect(await screen.findByText("Delivered")).toBeInTheDocument();

    // There should be no product image because no products
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it('renders "Failed" when payment is missing', async () => {
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({
        data: [
        {
            _id: "o4",
            status: "Pending",
            buyer: { name: "Dave" },
            createdAt: "2024-01-01T00:00:00.000Z",
            // payment intentionally missing
            products: [],
        },
        ],
    });

    render(<Orders />);

    expect(await screen.findByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Dave")).toBeInTheDocument();

    // with the Orders.js fix (payment?.success), this should render safely
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("uses index as key fallback when order _id is missing", async () => {
    mockUseAuth.mockReturnValue([{ token: "t" }, jest.fn()]);

    axios.get.mockResolvedValueOnce({
        data: [
        {
            // _id intentionally missing
            status: "NoIdStatus",
            buyer: { name: "Eve" },
            createdAt: "2024-01-01T00:00:00.000Z",
            payment: { success: true },
            products: [],
        },
        ],
    });

    render(<Orders />);

    expect(await screen.findByText("NoIdStatus")).toBeInTheDocument();
    expect(screen.getByText("Eve")).toBeInTheDocument();
  });
});
