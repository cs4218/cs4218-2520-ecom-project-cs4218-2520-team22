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

  it("renders Layout with correct title prop", () => {
    render(<About />);
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "About us - Ecommerce app");
  });

  it("renders the about image with correct src and alt", () => {
    render(<About />);
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/about.jpeg");
    expect(img).toHaveStyle({ width: "100%" });
  });

  it("renders the about text", () => {
    render(<About />);
    expect(screen.getByText(/Add text/i)).toBeInTheDocument();
  });

  it("renders the correct structure and classes", () => {
    render(<About />);
    expect(document.querySelector(".row.contactus")).toBeInTheDocument();
    expect(document.querySelector(".col-md-6")).toBeInTheDocument();
    expect(document.querySelector(".col-md-4")).toBeInTheDocument();
    expect(document.querySelector(".text-justify.mt-2")).toBeInTheDocument();
  });

  it("renders children inside Layout", () => {
    render(<About />);
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toContainElement(screen.getByAltText("contactus"));
    expect(layout).toContainElement(screen.getByText(/Add text/i));
  });
});
