import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="layout-mock" {...props}>
      {children}
    </div>
  ),
}));

describe("Pagenotfound page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Layout with correct title prop", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "go back- page not found");
  });

  it("renders 404 title, heading, and Go Back button", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/Oops ! Page Not Found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Go Back/i })).toBeInTheDocument();
  });

  it("Go Back button links to home page", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    const goBackLink = screen.getByRole("link", { name: /Go Back/i });
    expect(goBackLink).toHaveAttribute("href", "/");
    expect(goBackLink).toHaveClass("pnf-btn");
  });

  it("renders correct structure and classes", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    expect(document.querySelector(".pnf")).toBeInTheDocument();
    expect(document.querySelector(".pnf-title")).toHaveTextContent("404");
    expect(document.querySelector(".pnf-heading")).toHaveTextContent(
      "Oops ! Page Not Found",
    );
    expect(document.querySelector(".pnf-btn")).toHaveTextContent("Go Back");
  });

  it("renders all content inside Layout", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>,
    );
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toContainElement(screen.getByText("404"));
    expect(layout).toContainElement(screen.getByText(/Oops ! Page Not Found/i));
    expect(layout).toContainElement(
      screen.getByRole("link", { name: /Go Back/i }),
    );
  });
});
