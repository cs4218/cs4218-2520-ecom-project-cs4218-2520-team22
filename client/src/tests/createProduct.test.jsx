// Written by Qinzhe Wang A0337880U
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
/* =======================
   mocks
   ======================= */
const mockNavigate = jest.fn();

jest.mock("axios", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

jest.mock("antd", () => {
    const React = require("react");

    const Select = ({ children, onChange, ...props }) => (
        <select
            aria-label={props["aria-label"] || "select"}
            onChange={(e) => onChange?.(e.target.value)}
        >
            {children}
        </select>
    );

    Select.Option = ({ value, children }) => <option value={value}>{children}</option>;

    return { Select };
});

jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../components/AdminMenu", () => () => <div>AdminMenu</div>);

import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "../pages/admin/CreateProduct";

describe("CreateProduct (semantic)", () => {
    beforeAll(() => {
        // jsdom 没有 createObjectURL
        global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const fillForm = async () => {
        // 等 categories option 出现
        expect(await screen.findByRole("option", { name: "Electronics" }))
            .toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("category-select"), {
            target: { value: "1" },
        });

        fireEvent.change(screen.getByLabelText("shipping-select"), {
            target: { value: "1" }, // Yes
        });

        fireEvent.change(screen.getByPlaceholderText("write a name"), {
            target: { value: "iPhone" },
        });
        fireEvent.change(screen.getByPlaceholderText("write a description"), {
            target: { value: "New phone" },
        });
        fireEvent.change(screen.getByPlaceholderText("write a Price"), {
            target: { value: "999" },
        });
        fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
            target: { value: "10" },
        });

        const file = new File(["dummy"], "photo.png", { type: "image/png" });
        fireEvent.change(screen.getByLabelText("photo-input"), {
            target: { files: [file] },
        });

        await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalled());
    };

    test("loads categories on mount", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
        });

        render(<CreateProduct />);

        await waitFor(() =>
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
        );

        expect(await screen.findByRole("option", { name: "Electronics" }))
            .toBeInTheDocument();
    });

    test("submits product: on success shows success toast and navigates", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
        });

        axios.post.mockResolvedValueOnce({
            data: { success: true },
        });

        render(<CreateProduct />);

        await fillForm();

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith(
                "/api/v1/product/create-product",
                expect.any(FormData)
            )
        );

        await waitFor(() =>
            expect(toast.success).toHaveBeenCalledWith("Product Created Successfully")
        );
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
        expect(toast.error).not.toHaveBeenCalled();
    });

    test("submits product: on failure shows error toast and does not navigate", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
        });

        axios.post.mockResolvedValueOnce({
            data: { success: false, message: "Bad request" },
        });

        render(<CreateProduct />);

        await fillForm();

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith(
                "/api/v1/product/create-product",
                expect.any(FormData)
            )
        );

        await waitFor(() => expect(toast.error).toHaveBeenCalled());
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
    });
});
