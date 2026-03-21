// Song Yichao, A0255686M

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";

import Orders from "../pages/user/Orders";
import { AuthProvider } from "../context/auth";

jest.mock("axios");

// keep non-essential surrounding components light
jest.mock("../components/Layout", () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock("../components/UserMenu", () => {
  return function UserMenuMock() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

describe("Orders integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // Song Yichao, A0255686M
  it("fetches and renders orders correctly when auth token exists", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        token: "valid-token",
        user: { name: "Song" },
      })
    );

    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "o1",
          status: "Processing",
          buyer: { name: "Song" },
          createdAt: "2026-03-20T10:00:00.000Z",
          payment: { success: true },
          products: [
            {
              _id: "p1",
              name: "iPhone 15",
              description: "A very good phone with strong battery life and nice camera",
              price: 1999,
            },
            {
              _id: "p2",
              name: "Phone Case",
              description: "Protective transparent case for the phone device",
              price: 29,
            },
          ],
        },
      ],
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    expect(screen.getByText("All Orders")).toBeInTheDocument();

    // wait for actual rendered order cells
    expect(await screen.findByRole("cell", { name: "Processing" })).toBeInTheDocument();
    expect(await screen.findByRole("cell", { name: "Song" })).toBeInTheDocument();
    expect(await screen.findByRole("cell", { name: "Success" })).toBeInTheDocument();
    expect(await screen.findByRole("cell", { name: "2" })).toBeInTheDocument();

    // product cards
    expect(await screen.findByText("iPhone 15")).toBeInTheDocument();
    expect(await screen.findByText("Phone Case")).toBeInTheDocument();
    expect(await screen.findByText("Price : 1999")).toBeInTheDocument();
    expect(await screen.findByText("Price : 29")).toBeInTheDocument();

    // truncated descriptions
    expect(await screen.findByText("A very good phone with strong")).toBeInTheDocument();
    expect(await screen.findByText("Protective transparent case fo")).toBeInTheDocument();
  });

  // Song Yichao, A0255686M
  it("does not fetch orders when auth token is missing", async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
    expect(screen.queryByText("Processing")).not.toBeInTheDocument();
  });
});
