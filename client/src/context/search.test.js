// Song Yichao, A0255686M

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchProvider, useSearch } from "./search";

function TestComponent() {
  const [values, setValues] = useSearch();

  return (
    <div>
      <div data-testid="keyword">{values.keyword}</div>
      <div data-testid="results-count">{values.results.length}</div>
      <button
        onClick={() => setValues({ keyword: "hello", results: ["r1"] })}
      >
        update
      </button>
    </div>
  );
}

describe("SearchProvider / useSearch", () => {
  // add test case, Song Yichao, A0255686M
  it("provides default search state (keyword empty, results empty)", () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );

    expect(screen.getByTestId("keyword")).toHaveTextContent("");
    expect(screen.getByTestId("results-count")).toHaveTextContent("0");
  });

  // add test case, Song Yichao, A0255686M
  it("allows updating search state via setter", () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    expect(screen.getByTestId("keyword")).toHaveTextContent("hello");
    expect(screen.getByTestId("results-count")).toHaveTextContent("1");
  });

  // add test case, Song Yichao, A0255686M
  it("throws a clear error if useSearch is used outside SearchProvider", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(/SearchProvider/i);
    errorSpy.mockRestore();
  });
});
