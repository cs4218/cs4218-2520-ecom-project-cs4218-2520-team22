import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Header from "./Header";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import toast from "react-hot-toast";

// Mock dependencies
jest.mock("../context/auth");
jest.mock("../context/cart");
jest.mock("../hooks/useCategory");
jest.mock("react-hot-toast");
jest.mock("./Form/SearchInput", () => () => <div data-testid="search-input" />);

const mockCategories = [
  { name: "Electronics", slug: "electronics" },
  { name: "Books", slug: "books" },
];

const renderHeader = () =>
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>,
  );

describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue(mockCategories);
    useCart.mockReturnValue([[{ id: 1 }, { id: 2 }]]);
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      useAuth.mockReturnValue([null, jest.fn()]);
    });

    it("renders brand and navigation links", () => {
      renderHeader();
      expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();
      expect(screen.getByText(/Home/i)).toBeInTheDocument();
      expect(screen.getByText(/^Categories$/i)).toBeInTheDocument();
      expect(screen.getByText(/Cart/i)).toBeInTheDocument();
    });

    it("renders Register and Login links", () => {
      renderHeader();
      expect(screen.getByText(/Register/i)).toBeInTheDocument();
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });

    it("renders all categories in dropdown", () => {
      renderHeader();
      fireEvent.click(screen.getByText(/^Categories$/i));
      expect(screen.getByText("All Categories")).toBeInTheDocument();
      mockCategories.forEach((cat) => {
        expect(screen.getByText(cat.name)).toBeInTheDocument();
      });
    });

    it("renders cart badge with correct count", () => {
      renderHeader();
      expect(screen.getByText(/Cart/i).parentElement).toHaveTextContent("2");
    });

    it("renders search input", () => {
      renderHeader();
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });
  });

  describe("when user is authenticated (role: user)", () => {
    const setAuth = jest.fn();
    const user = { name: "Ali", role: 0 };
    beforeEach(() => {
      useAuth.mockReturnValue([{ user, token: "abc" }, setAuth]);
    });

    it("shows user name and dashboard/logout dropdown", () => {
      renderHeader();
      expect(screen.getByText(user.name)).toBeInTheDocument();
      fireEvent.click(screen.getByText(user.name));
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    it("dashboard link points to user dashboard", () => {
      renderHeader();
      fireEvent.click(screen.getByText(user.name));
      const dashboardLink = screen.getByText(/Dashboard/i).closest("a");
      expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
    });

    it("calls logout logic and shows toast", () => {
      renderHeader();
      fireEvent.click(screen.getByText(user.name));
      fireEvent.click(screen.getByText(/Logout/i));
      expect(setAuth).toHaveBeenCalledWith({
        user: null,
        token: "",
      });
      expect(toast.success).toHaveBeenCalledWith("Logout successful");
    });
  });

  describe("when user is authenticated (role: admin)", () => {
    const setAuth = jest.fn();
    const user = { name: "Admin", role: 1 };
    beforeEach(() => {
      useAuth.mockReturnValue([{ user, token: "admin-token" }, setAuth]);
    });

    it("dashboard link points to admin dashboard", () => {
      renderHeader();
      fireEvent.click(screen.getByText(user.name));
      const dashboardLink = screen.getByText(/Dashboard/i).closest("a");
      expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
    });
  });

  describe("UI structure and accessibility", () => {
    beforeEach(() => {
      useAuth.mockReturnValue([null, jest.fn()]);
    });

    it("has navbar toggler for mobile", () => {
      renderHeader();
      expect(screen.getByLabelText(/toggle navigation/i)).toBeInTheDocument();
    });

    it("navbar links have correct classes", () => {
      renderHeader();
      expect(screen.getByText(/Home/i).closest("a")).toHaveClass("nav-link");
      expect(screen.getByText(/^Categories$/i).closest("a")).toHaveClass(
        "nav-link",
      );
    });
  });
});
