// MANSOOR Syed Ali A0337939J

import React from "react";
import { render, screen } from "@testing-library/react";
import Layout from "./Layout";

// Mock dependencies
jest.mock("./Header", () => () => <div data-testid="header" />);
jest.mock("./Footer", () => () => <div data-testid="footer" />);
jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));
jest.mock("react-helmet", () => {
  return {
    Helmet: ({ children }) => <>{children}</>,
  };
});

describe("Layout component", () => {
  const customProps = {
    title: "Custom Title",
    description: "Custom description",
    keywords: "custom,keywords",
    author: "Custom Author",
  };

  it("renders Header, Footer, Toaster, and children", () => {
    render(
      <Layout {...customProps}>
        <div data-testid="child">Child Content</div>
      </Layout>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
  });

  it("renders meta tags and title with custom props", () => {
    render(
      <Layout {...customProps}>
        <div>Test</div>
      </Layout>,
    );
    // Since react-helmet is mocked, check for meta and title elements in the output
    expect(document.querySelector('meta[name="description"]').content).toBe(
      customProps.description,
    );
    expect(document.querySelector('meta[name="keywords"]').content).toBe(
      customProps.keywords,
    );
    expect(document.querySelector('meta[name="author"]').content).toBe(
      customProps.author,
    );
    expect(document.title).toBe(customProps.title);
  });

  it("renders meta tags and title with default props if not provided", () => {
    render(
      <Layout>
        <div>Test</div>
      </Layout>,
    );
    expect(document.querySelector('meta[name="description"]').content).toBe(
      Layout.defaultProps.description,
    );
    expect(document.querySelector('meta[name="keywords"]').content).toBe(
      Layout.defaultProps.keywords,
    );
    expect(document.querySelector('meta[name="author"]').content).toBe(
      Layout.defaultProps.author,
    );
    expect(document.title).toBe(Layout.defaultProps.title);
  });

  it("applies minHeight style to main element", () => {
    render(
      <Layout>
        <div>Test</div>
      </Layout>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveStyle({ minHeight: "70vh" });
  });

  it("renders children inside main element", () => {
    render(
      <Layout>
        <span data-testid="inside-main">Inside Main</span>
      </Layout>,
    );
    const main = screen.getByRole("main");
    expect(main).toContainElement(screen.getByTestId("inside-main"));
  });
});
