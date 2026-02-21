// Written by Qinzhe Wang A0337880U
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Products from "../pages/admin/Products";
import axios from "axios";

/* =======================
   mocks
   ======================= */

jest.mock("axios", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}));

jest.mock("../components/Layout", () => ({ children }) => (
    <div>{children}</div>
));

jest.mock("../components/AdminMenu", () => () => (
    <div>AdminMenu</div>
));

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    Link: ({ to, children }) => (
        <a href={to}>{children}</a>
    ),
}));

/* =======================
   tests
   ======================= */

describe("Products (Admin)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("fetches products on mount and displays them", async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                products: [
                    {
                        _id: "p1",
                        name: "iPhone",
                        description: "New phone",
                        slug: "iphone",
                    },
                ],
            },
        });

        render(<Products />);

        // API 被调用
        await waitFor(() =>
            expect(axios.get).toHaveBeenCalledWith(
                "/api/v1/product/get-product"
            )
        );

        // 产品内容渲染
        expect(await screen.findByText("iPhone")).toBeInTheDocument();
        expect(screen.getByText("New phone")).toBeInTheDocument();
    });

    test("renders correct product link", async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                products: [
                    {
                        _id: "p1",
                        name: "iPhone",
                        description: "New phone",
                        slug: "iphone",
                    },
                ],
            },
        });

        render(<Products />);

        const link = await screen.findByRole("link", {
            name: /iphone/i,
        });

        expect(link).toHaveAttribute(
            "href",
            "/dashboard/admin/product/iphone"
        );
    });
});
