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

  it("renders Layout with the correct title", () => {
    render(<Policy />);

    const layout = screen.getByTestId("layout-mock");

    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "Privacy Policy");
  });

  it("renders all privacy policy paragraphs", () => {
    render(<Policy />);

    const paragraphs = screen.getAllByText("add privacy policy");

    expect(paragraphs.length).toBe(7);
    paragraphs.forEach((p) => expect(p.tagName).toBe("P"));
  });
});
