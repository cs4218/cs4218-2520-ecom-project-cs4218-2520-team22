import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminOrders from "../pages/admin/AdminOrders";
import axios from "axios";
/* =======================
   mocks
   ======================= */
jest.mock("axios", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../components/AdminMenu", () => () => <div>AdminMenu</div>);

const mockUseAuth = jest.fn();
jest.mock("../context/auth", () => ({
    useAuth: () => mockUseAuth(),
}));

jest.mock("antd", () => {
    const React = require("react");
    const Select = ({ children, onChange, defaultValue }) => (
        <select
            aria-label="status-select"
            defaultValue={defaultValue}
            onChange={(e) => onChange?.(e.target.value)}
        >
            {children}
        </select>
    );
    Select.Option = ({ value, children }) => <option value={value}>{children}</option>;
    return { Select };
});

jest.mock("moment", () => () => ({
    fromNow: () => "some time ago",
}));
/* =======================
   tests
   ======================= */
describe("AdminOrders", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("does not fetch orders when auth token is missing", async () => {
        mockUseAuth.mockReturnValue([{ token: null }, jest.fn()]);

        render(<AdminOrders />);

        await waitFor(() => {
            expect(axios.get).not.toHaveBeenCalled();
        });

        expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    test("fetches orders when auth token exists and renders order details", async () => {
        mockUseAuth.mockReturnValue([{ token: "token" }, jest.fn()]);

        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: "o1",
                    status: "Processing",
                    buyer: { name: "Alice" },
                    createAt: "2020-01-01T00:00:00.000Z",
                    payment: { success: true },
                    products: [
                        {
                            _id: "p1",
                            name: "iPhone",
                            description: "New phone description that is long enough",
                            price: 999,
                        },
                    ],
                },
            ],
        });

        render(<AdminOrders />);

        await waitFor(() =>
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders")
        );

        expect(await screen.findByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Success")).toBeInTheDocument();
        const row = screen.getByText("Alice").closest("tr");
        const cells = within(row).getAllByRole("cell");
        expect(cells[cells.length - 1]).toHaveTextContent("1");

        expect(screen.getByText("iPhone")).toBeInTheDocument();
        expect(screen.getByText(/Price : 999/)).toBeInTheDocument();

        const img = screen.getByAltText("iPhone");
        expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/p1");
    });

    test("changes order status: PUT then refreshes orders with GET", async () => {
        mockUseAuth.mockReturnValue([{ token: "token" }, jest.fn()]);

        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: "o1",
                    status: "Not Process",
                    buyer: { name: "Alice" },
                    createAt: "2020-01-01T00:00:00.000Z",
                    payment: { success: true },
                    products: [],
                },
            ],
        });

        axios.put.mockResolvedValueOnce({ data: { success: true } });

        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: "o1",
                    status: "Shipped",
                    buyer: { name: "Alice" },
                    createAt: "2020-01-01T00:00:00.000Z",
                    payment: { success: true },
                    products: [],
                },
            ],
        });

        render(<AdminOrders />);

        expect(await screen.findByText("Alice")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("status-select"), {
            target: { value: "Shipped" },
        });

        await waitFor(() =>
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/o1", {
                status: "Shipped",
            })
        );

        await waitFor(() =>
            expect(axios.get).toHaveBeenCalledTimes(2)
        );
    });
});
