// Song Yichao, A0255686M

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Profile from "./Profile";

jest.mock("axios");
jest.mock("react-hot-toast");

// Mock Layout
jest.mock("./../../components/Layout", () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock UserMenu
jest.mock("../../components/UserMenu", () => {
  return function UserMenuMock() {
    return <div data-testid="user-menu">user-menu</div>;
  };
});

// Mock useAuth
const mockUseAuth = jest.fn();
jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Profile page", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Ensure localStorage exists
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  // add test case, Song Yichao, A0255686M
  it("prefills the form fields from auth.user", async () => {
    mockUseAuth.mockReturnValue([
      {
        user: {
          name: "Alice",
          email: "alice@example.com",
          phone: "123",
          address: "SG",
        },
      },
      jest.fn(),
    ]);

    render(<Profile />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue("Alice");
    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue("alice@example.com");
    expect(screen.getByPlaceholderText(/enter your phone/i)).toHaveValue("123");
    expect(screen.getByPlaceholderText(/enter your address/i)).toHaveValue("SG");

    // email field should be disabled
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeDisabled();
  });

  // add test case, Song Yichao, A0255686M
  it("allows editing name/phone/address/password and submits update successfully", async () => {
    const setAuth = jest.fn();
    mockUseAuth.mockReturnValue([
      {
        token: "t",
        user: {
          name: "Alice",
          email: "alice@example.com",
          phone: "123",
          address: "SG",
        },
      },
      setAuth,
    ]);

    window.localStorage.getItem.mockReturnValue(
      JSON.stringify({
        token: "t",
        user: { name: "Alice", email: "alice@example.com", phone: "123", address: "SG" },
      })
    );

    axios.put.mockResolvedValueOnce({
      data: {
        updatedUser: {
          name: "New Name",
          email: "alice@example.com",
          phone: "999",
          address: "New Address",
        },
      },
    });

    render(<Profile />);

    fireEvent.change(screen.getByPlaceholderText(/enter your name/i), {
      target: { value: "New Name" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "newpass" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), {
      target: { value: "999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your address/i), {
      target: { value: "New Address" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "New Name",
        email: "alice@example.com",
        password: "newpass",
        phone: "999",
        address: "New Address",
      });
    });

    expect(setAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ name: "New Name", phone: "999", address: "New Address" }),
      })
    );

    expect(window.localStorage.setItem).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
  });

  // add test case, Song Yichao, A0255686M
  it("shows toast.error when backend returns data.error", async () => {
    mockUseAuth.mockReturnValue([
      {
        user: {
          name: "Alice",
          email: "alice@example.com",
          phone: "123",
          address: "SG",
        },
      },
      jest.fn(),
    ]);

    axios.put.mockResolvedValueOnce({ data: { error: "Bad request" } });

    render(<Profile />);

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    expect(toast.error).toHaveBeenCalledWith("Bad request");
  });

  // add test case, Song Yichao, A0255686M
  it("logs error and shows toast.error when request throws", async () => {
    mockUseAuth.mockReturnValue([
      {
        user: {
          name: "Alice",
          email: "alice@example.com",
          phone: "123",
          address: "SG",
        },
      },
      jest.fn(),
    ]);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.put.mockRejectedValueOnce(new Error("network"));

    render(<Profile />);

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    expect(logSpy).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");

    logSpy.mockRestore();
  });

  // add test case, Song Yichao, A0255686M
  it("does not crash when auth.user is missing", () => {
    mockUseAuth.mockReturnValue([{}, jest.fn()]);

    render(<Profile />);

    // still renders form and update button
    expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("handles invalid localStorage auth JSON by falling back to empty object", async () => {
    const setAuth = jest.fn();
    mockUseAuth.mockReturnValue([
        {
        token: "t",
        user: {
            name: "Alice",
            email: "alice@example.com",
            phone: "123",
            address: "SG",
        },
        },
        setAuth,
    ]);

    // invalid JSON => JSON.parse throws => catch branch executed
    window.localStorage.getItem.mockReturnValue("{not-valid-json");

    axios.put.mockResolvedValueOnce({
        data: {
        updatedUser: {
            name: "Alice",
            email: "alice@example.com",
            phone: "123",
            address: "SG",
        },
        },
    });

    render(<Profile />);

    // submit without changing fields is fine
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());

    // should still attempt to persist auth after fallback
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "auth",
        expect.any(String)
    );
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
  });

  // add test case, Song Yichao, A0255686M
  it("falls back to empty strings when user fields are null/undefined", async () => {
    mockUseAuth.mockReturnValue([
        {
        user: {
            name: undefined,
            email: undefined,
            phone: null,
            address: null,
        },
        },
        jest.fn(),
    ]);

    render(<Profile />);

    expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/enter your phone/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/enter your address/i)).toHaveValue("");
  });

  // add test case, Song Yichao, A0255686M
  it("uses empty object when localStorage auth is missing (covers ternary false branch)", async () => {
    const setAuth = jest.fn();

    mockUseAuth.mockReturnValue([
        {
        token: "t",
        user: {
            name: "Alice",
            email: "alice@example.com",
            phone: "123",
            address: "SG",
        },
        },
        setAuth,
    ]);

    // localStorage missing -> getItem returns null -> ternary takes : {}
    window.localStorage.getItem.mockReturnValue(null);

    axios.put.mockResolvedValueOnce({
        data: {
        updatedUser: {
            name: "Alice",
            email: "alice@example.com",
            phone: "123",
            address: "SG",
        },
        },
    });

    render(<Profile />);

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());

    // still persists safely
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "auth",
        expect.any(String)
    );
  });
});
