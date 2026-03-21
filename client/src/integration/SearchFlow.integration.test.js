// Song Yichao, A0255686M

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import SearchInput from "../components/Form/SearchInput";
import Search from "../pages/Search";
import { SearchProvider } from "../context/search";

jest.mock("axios");

// Keep Layout lightweight so Header/Footer don't introduce unrelated dependencies
jest.mock("../components/Layout", () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

describe("Search integration flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Song Yichao, A0255686M
  it("submits from SearchInput, updates Search context, navigates to /search, and renders results in Search page", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "p1",
          name: "iPhone 15",
          description: "A very good phone with strong battery life",
          price: 1999,
        },
        {
          _id: "p2",
          name: "iPhone Case",
          description: "Protective case for your phone device",
          price: 29,
        },
      ],
    });

    render(
      <SearchProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<SearchInput />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    );

    fireEvent.change(screen.getByRole("searchbox", { name: /search/i }), {
      target: { value: "iphone" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/iphone");
    });

    expect(await screen.findByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("Found 2")).toBeInTheDocument();
    expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    expect(screen.getByText("iPhone Case")).toBeInTheDocument();
  });

  // Song Yichao, A0255686M
  it('shows "No Products Found" when the API returns an empty result set', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <SearchProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<SearchInput />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    );

    fireEvent.change(screen.getByRole("searchbox", { name: /search/i }), {
      target: { value: "zzzz_not_found" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/zzzz_not_found");
    });

    expect(await screen.findByText("Search Results")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });
});
