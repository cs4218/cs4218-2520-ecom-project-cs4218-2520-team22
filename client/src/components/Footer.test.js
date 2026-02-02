import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe("Footer", () => {
  it("renders without crashing", () => {
    render(<Footer />);
    expect(
      screen.getByText("All Rights Reserved © TestingComp"),
    ).toBeInTheDocument();
  });

  it("renders About link", () => {
    render(<Footer />);
    const aboutLink = screen.getByText("About");
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink.closest("a")).toHaveAttribute("href", "/about");
  });

  it("renders Contact link", () => {
    render(<Footer />);
    const contactLink = screen.getByText("Contact");
    expect(contactLink).toBeInTheDocument();
    expect(contactLink.closest("a")).toHaveAttribute("href", "/contact");
  });

  it("renders Privacy Policy link", () => {
    render(<Footer />);
    const policyLink = screen.getByText("Privacy Policy");
    expect(policyLink).toBeInTheDocument();
    expect(policyLink.closest("a")).toHaveAttribute("href", "/policy");
  });
});
