// Song Yichao, A0255686M

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Search from "./Search";

// Mock Layout to isolate Search page
jest.mock("../components/Layout", () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock useSearch
const mockUseSearch = jest.fn();
jest.mock("../context/search", () => ({
  useSearch: () => mockUseSearch(),
}));

describe("Search page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // add test case, Song Yichao, A0255686M
  it('shows "No Products Found" when results are empty', () => {
    mockUseSearch.mockReturnValue([{ keyword: "abc", results: [] }, jest.fn()]);

    render(<Search />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /search results/i })).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("shows Found N when results exist and renders product cards", () => {
    mockUseSearch.mockReturnValue([
      {
        keyword: "phone",
        results: [
          {
            _id: "p1",
            name: "iPhone",
            description: "This is a very good phone with great camera",
            price: 1000,
          },
          {
            _id: "p2",
            name: "Android",
            description: "Affordable device with decent performance",
            price: 500,
          },
        ],
      },
      jest.fn(),
    ]);

    render(<Search />);

    expect(screen.getByText("Found 2")).toBeInTheDocument();

    // product names rendered
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Android")).toBeInTheDocument();

    // buttons rendered (2 products -> 2 each)
    expect(screen.getAllByRole("button", { name: /more details/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /add to cart/i })).toHaveLength(2);

    // image alt text uses product name
    expect(screen.getByAltText("iPhone")).toBeInTheDocument();
    expect(screen.getByAltText("Android")).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("renders truncated description with ellipsis", () => {
    const longDesc = "123456789012345678901234567890ABCDEFGHIJ"; // length > 30
    mockUseSearch.mockReturnValue([
      {
        keyword: "x",
        results: [
          { _id: "p1", name: "Item", description: longDesc, price: 10 },
        ],
      },
      jest.fn(),
    ]);

    render(<Search />);

    // substring(0, 30) + "..."
    expect(screen.getByText(`${longDesc.substring(0, 30)}...`)).toBeInTheDocument();
  });
});
