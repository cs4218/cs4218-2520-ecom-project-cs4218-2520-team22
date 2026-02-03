import React from "react";
import { render, screen } from "@testing-library/react";
import Policy from "./Policy";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="layout-mock" {...props}>
      {children}
    </div>
  ),
}));

describe("Policy page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Layout with correct title prop", () => {
    render(<Policy />);
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "Privacy Policy");
  });

  it("renders the contact image with correct src and alt", () => {
    render(<Policy />);
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
    expect(img).toHaveStyle({ width: "100%" });
  });

  it("renders all privacy policy paragraphs", () => {
    render(<Policy />);
    const paragraphs = screen.getAllByText("add privacy policy");
    expect(paragraphs.length).toBe(7);
    paragraphs.forEach((p) => expect(p.tagName).toBe("P"));
  });

  it("renders correct structure and classes", () => {
    render(<Policy />);
    expect(document.querySelector(".row.contactus")).toBeInTheDocument();
    expect(document.querySelector(".col-md-6")).toBeInTheDocument();
    expect(document.querySelector(".col-md-4")).toBeInTheDocument();
  });

  it("renders all content inside Layout", () => {
    render(<Policy />);
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toContainElement(screen.getByAltText("contactus"));
    screen.getAllByText("add privacy policy").forEach((p) => {
      expect(layout).toContainElement(p);
    });
  });
});
