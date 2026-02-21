// MANSOOR Syed Ali A0337939J

import React from "react";
import { render, screen } from "@testing-library/react";
import About from "./About";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="layout-mock" {...props}>
      {children}
    </div>
  ),
}));

describe("About page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Layout with the correct title", () => {
    render(<About />);

    const layout = screen.getByTestId("layout-mock");

    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "About us - Ecommerce app");
  });

  it("renders the about text", () => {
    render(<About />);

    expect(screen.getByText(/Add text/i)).toBeInTheDocument();
  });
});
