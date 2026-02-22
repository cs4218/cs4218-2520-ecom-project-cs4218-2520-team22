// Song Yichao, A0255686M

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import UserMenu from "./UserMenu";

describe("UserMenu", () => {
  // add test case, Song Yichao, A0255686M
  it("renders the Dashboard heading", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("renders Profile and Orders links with correct hrefs", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByRole("link", { name: /profile/i });
    const ordersLink = screen.getByRole("link", { name: /orders/i });

    expect(profileLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();

    expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
    expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
  });

  // add test case, Song Yichao, A0255686M
  it("applies bootstrap list-group classes to links", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByRole("link", { name: /profile/i });
    const ordersLink = screen.getByRole("link", { name: /orders/i });

    expect(profileLink).toHaveClass("list-group-item", "list-group-item-action");
    expect(ordersLink).toHaveClass("list-group-item", "list-group-item-action");
  });
});
