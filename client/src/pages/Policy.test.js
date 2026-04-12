// MANSOOR Syed Ali A0337939J

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
    const { container } = render(<Policy />);

    expect(
      screen.getByText(/We collect only the information needed to provide our services/i),
    ).toBeInTheDocument();

    const paragraphs = container.querySelectorAll(".col-md-4 p");

    expect(paragraphs.length).toBe(2);
    paragraphs.forEach((p) => expect(p.tagName).toBe("P"));
  });
});
