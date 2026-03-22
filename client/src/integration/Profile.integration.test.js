// Song Yichao, A0255686M

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";

import Profile from "../pages/user/Profile";
import { AuthProvider } from "../context/auth";

jest.mock("axios");

// keep surrounding layout/menu lightweight
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

// toast mock
const mockSuccesss = jest.fn();
const mockError = jest.fn();

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: (...args) => mockSuccesss(...args),
    error: (...args) => mockError(...args),
  },
}));

describe("Profile integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    localStorage.setItem(
      "auth",
      JSON.stringify({
        token: "valid-token",
        user: {
          name: "Song",
          email: "song@example.com",
          phone: "91234567",
          address: "Old Address",
        },
      })
    );
  });

  // Song Yichao, A0255686M
  it("prefills profile fields from auth state, submits updates, and syncs updated user to localStorage", async () => {
    axios.put.mockResolvedValueOnce({
      data: {
        updatedUser: {
          name: "Song Updated",
          email: "song@example.com",
          phone: "98765432",
          address: "New Address",
        },
      },
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthProvider>
    );

    // initial values from auth/localStorage
    expect(screen.getByDisplayValue("Song")).toBeInTheDocument();
    expect(screen.getByDisplayValue("song@example.com")).toBeDisabled();
    expect(screen.getByDisplayValue("91234567")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old Address")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Song"), {
      target: { value: "Song Updated" },
    });
    fireEvent.change(screen.getByDisplayValue("91234567"), {
      target: { value: "98765432" },
    });
    fireEvent.change(screen.getByDisplayValue("Old Address"), {
      target: { value: "New Address" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "Song Updated",
        email: "song@example.com",
        password: "",
        phone: "98765432",
        address: "New Address",
      });
    });

    expect(mockSuccesss).toHaveBeenCalled();

    const storedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(storedAuth.user).toEqual({
      name: "Song Updated",
      email: "song@example.com",
      phone: "98765432",
      address: "New Address",
    });
  });

  // Song Yichao, A0255686M
  it("shows error feedback and does not overwrite localStorage when backend returns an error", async () => {
    axios.put.mockResolvedValueOnce({
      data: {
        error: "Profile update failed",
      },
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByDisplayValue("Song"), {
      target: { value: "Should Not Persist" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    expect(mockError).toHaveBeenCalled();

    const storedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(storedAuth.user).toEqual({
      name: "Song",
      email: "song@example.com",
      phone: "91234567",
      address: "Old Address",
    });
  });
});
