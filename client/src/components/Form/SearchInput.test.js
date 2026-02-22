// Song Yichao, A0255686M

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import SearchInput from "./SearchInput";

// mock axios
jest.mock("axios");

// mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// mock useSearch
const mockUseSearch = jest.fn();
jest.mock("../../context/search", () => ({
  useSearch: () => mockUseSearch(),
}));

describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // add test case, Song Yichao, A0255686M
  it("renders search input and submit button", () => {
    mockUseSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);

    render(<SearchInput />);

    expect(screen.getByRole("searchbox", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^search$/i })).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("updates keyword when user types", () => {
    const setValues = jest.fn();
    mockUseSearch.mockReturnValue([{ keyword: "", results: [] }, setValues]);

    render(<SearchInput />);

    const input = screen.getByRole("searchbox", { name: /search/i });
    fireEvent.change(input, { target: { value: "laptop" } });

    // setValues called with updated keyword
    expect(setValues).toHaveBeenCalledWith({ keyword: "laptop", results: [] });
  });

  // add test case, Song Yichao, A0255686M
  it("submits search, stores results, and navigates to /search on success", async () => {
    const setValues = jest.fn();
    mockUseSearch.mockReturnValue([{ keyword: "iphone", results: [] }, setValues]);

    axios.get.mockResolvedValueOnce({ data: [{ _id: "p1" }] });

    render(<SearchInput />);

    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/iphone");
    });

    expect(setValues).toHaveBeenCalledWith({
      keyword: "iphone",
      results: [{ _id: "p1" }],
    });

    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  // add test case, Song Yichao, A0255686M
  it("logs error when request fails and does not crash", async () => {
    const setValues = jest.fn();
    mockUseSearch.mockReturnValue([{ keyword: "bad", results: [] }, setValues]);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("network"));

    render(<SearchInput />);

    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/bad");
    });

    expect(logSpy).toHaveBeenCalled();
    expect(setValues).not.toHaveBeenCalledWith(expect.objectContaining({ results: expect.anything() }));
    expect(mockNavigate).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
