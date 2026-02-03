import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import Layout from "../components/Layout";
import { BiMailSend, BiPhoneCall, BiSupport } from "react-icons/bi";

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="layout-mock" {...props}>
      {children}
    </div>
  ),
}));

describe("Contact page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Layout with correct title prop", () => {
    render(<Contact />);
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("title", "Contact us");
  });

  it("renders the contact image with correct src and alt", () => {
    render(<Contact />);
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
    expect(img).toHaveStyle({ width: "100%" });
  });

  it("renders the CONTACT US heading with correct classes", () => {
    render(<Contact />);
    const heading = screen.getByText("CONTACT US");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("bg-dark", "p-2", "text-white", "text-center");
  });

  it("renders the info paragraph", () => {
    render(<Contact />);
    expect(
      screen.getByText(
        /For any query or info about product, feel free to call anytime. We are available 24X7/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders all contact info with icons and correct text", () => {
    render(<Contact />);
    // Email
    expect(screen.getByText(/www.help@ecommerceapp.com/i)).toBeInTheDocument();
    // Phone
    expect(screen.getByText(/012-3456789/i)).toBeInTheDocument();
    // Support
    expect(
      screen.getByText(/1800-0000-0000 \(toll free\)/i),
    ).toBeInTheDocument();
    // Check icons
    const mailIcon = screen.getByText(
      /www.help@ecommerceapp.com/i,
    ).previousSibling;
    const phoneIcon = screen.getByText(/012-3456789/i).previousSibling;
    const supportIcon = screen.getByText(/1800-0000-0000/i).previousSibling;
    expect(mailIcon).toBeTruthy();
    expect(phoneIcon).toBeTruthy();
    expect(supportIcon).toBeTruthy();
  });

  it("renders correct structure and classes", () => {
    render(<Contact />);
    expect(document.querySelector(".row.contactus")).toBeInTheDocument();
    expect(document.querySelector(".col-md-6")).toBeInTheDocument();
    expect(document.querySelector(".col-md-4")).toBeInTheDocument();
    expect(document.querySelector(".text-justify.mt-2")).toBeInTheDocument();
    expect(document.querySelectorAll(".mt-3").length).toBe(3);
  });

  it("renders all content inside Layout", () => {
    render(<Contact />);
    const layout = screen.getByTestId("layout-mock");
    expect(layout).toContainElement(screen.getByAltText("contactus"));
    expect(layout).toContainElement(screen.getByText("CONTACT US"));
    expect(layout).toContainElement(
      screen.getByText(/www.help@ecommerceapp.com/i),
    );
    expect(layout).toContainElement(screen.getByText(/012-3456789/i));
    expect(layout).toContainElement(screen.getByText(/1800-0000-0000/i));
  });
});
