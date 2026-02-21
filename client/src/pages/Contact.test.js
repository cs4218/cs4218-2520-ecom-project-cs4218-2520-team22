import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="layout-mock" {...props}>
      {children}
    </div>
  ),
}));

const CONTACT_INFO = {
  email: "help@ecommerceapp.com",
  phone: "012-3456789",
  tollFree: "1800-0000-0000",
};

describe("Contact page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Layout with the correct title", () => {
    render(<Contact />);

    const layout = screen.getByTestId("layout-mock");

    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "Contact us");
  });

  it("renders the correct email address as a clickable link", () => {
    render(<Contact />);

    const emailElement = screen.getByText(
      new RegExp(`^${CONTACT_INFO.email}$`),
    );

    expect(emailElement).toBeInTheDocument();
    expect(emailElement.tagName.toLowerCase()).toBe("a");
    expect(emailElement).toHaveAttribute(
      "href",
      `mailto:${CONTACT_INFO.email}`,
    );
  });

  it("renders the correct phone number as a clickable link", () => {
    render(<Contact />);

    const phoneElement = screen.getByText(
      new RegExp(`^${CONTACT_INFO.phone}$`),
    );

    expect(phoneElement).toBeInTheDocument();
    expect(phoneElement.tagName.toLowerCase()).toBe("a");
    expect(phoneElement).toHaveAttribute("href", `tel:${CONTACT_INFO.phone}`);
  });

  it("renders the correct toll-free number as a clickable link", () => {
    render(<Contact />);

    const tollFreeElement = screen.getByText(
      new RegExp(`^${CONTACT_INFO.tollFree}$`),
    );
    expect(tollFreeElement).toBeInTheDocument();
    expect(tollFreeElement.tagName.toLowerCase()).toBe("a");
    expect(tollFreeElement).toHaveAttribute(
      "href",
      `tel:${CONTACT_INFO.tollFree}`,
    );
  });
});
