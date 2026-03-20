// Song Yichao, A0255686M

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "./Dashboard";

// Mock Layout to avoid bringing Header / other side effects into this unit test
jest.mock("../../components/Layout", () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock UserMenu so this test focuses on Dashboard page
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

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // add test case, Song Yichao, A0255686M
  it("renders user name, email, and address from auth context", () => {
    mockUseAuth.mockReturnValue([
      {
        user: {
          name: "Alice Tan",
          email: "alice@example.com",
          address: "Singapore",
        },
      },
      jest.fn(),
    ]);

    render(<Dashboard />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();

    expect(screen.getByText("Alice Tan")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Singapore")).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("does not crash when auth user is missing", () => {
    mockUseAuth.mockReturnValue([{}, jest.fn()]);

    render(<Dashboard />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();

    expect(screen.queryByRole("heading", { name: /@/i })).not.toBeInTheDocument();
  });
});
