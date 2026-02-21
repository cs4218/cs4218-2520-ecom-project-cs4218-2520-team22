// Written by Qinzhe Wang A0337880U
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "../pages/admin/CreateProduct";
import UpdateProduct from "../pages/admin/UpdateProduct";
/* =======================
   mocks
   ======================= */
jest.mock("axios", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));
jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: "iphone-slug" }),
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

    Select.Option = ({ value, children }) => (
        <option value={value}>{children}</option>
    );

    return { Select };
});


jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../components/AdminMenu", () => () => <div>AdminMenu</div>);



describe("UpdateProduct Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    });

    test("loads product and categories on mount", async () => {
        axios.get
            // get single product
            .mockResolvedValueOnce({
                data: {
                    product: {
                        _id: "1",
                        name: "iPhone",
                        description: "Old phone",
                        price: 999,
                        quantity: 5,
                        shipping: 1,
                        category: { _id: "c1" },
                    },
                },
            })
            // get categories
            .mockResolvedValueOnce({
                data: {
                    success: true,
                    category: [{ _id: "c1", name: "Electronics" }],
                },
            });

        render(<UpdateProduct />);

        expect(await screen.findByDisplayValue("iPhone")).toBeInTheDocument();
        expect(await screen.findByText("Electronics")).toBeInTheDocument();
    });


    test("updates product and navigates on success", async () => {
        axios.get
            .mockResolvedValueOnce({
                data: {
                    product: {
                        _id: "1",
                        name: "iPhone",
                        description: "Old phone",
                        price: 999,
                        quantity: 5,
                        shipping: 1,
                        category: { _id: "c1" },
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    success: true,
                    category: [{ _id: "c1", name: "Electronics" }],
                },
            });

        axios.put.mockResolvedValueOnce({ data: { success: true } });

        render(<UpdateProduct />);

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
        expect(await screen.findByDisplayValue("iPhone")).toBeInTheDocument();
        expect(screen.getByAltText("product_photo"))
            .toHaveAttribute("src", "/api/v1/product/product-photo/1");

        fireEvent.change(screen.getByPlaceholderText("write a name"), {
            target: { value: "iPhone Pro" },
        });

        fireEvent.click(screen.getByText("UPDATE PRODUCT"));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled();
        });

        expect(axios.put.mock.calls[0][0]).toBe("/api/v1/product/update-product/1");

        const fd = axios.put.mock.calls[0][1];
        expect(fd).toBeTruthy();
        expect(typeof fd.append).toBe("function");
        expect(toast.error).not.toHaveBeenCalled();
        await waitFor(()=> expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully"));
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    test("deletes product after confirmation", async () => {
        window.prompt = jest.fn(() => true);

        axios.get
            .mockResolvedValueOnce({
                data: {
                    product: {
                        _id: "1",
                        name: "iPhone",
                        description: "Old phone",
                        price: 999,
                        quantity: 5,
                        shipping: 1,
                        category: { _id: "c1" },
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    success: true,
                    category: [{ _id: "c1", name: "Electronics" }],
                },
            });

        axios.delete.mockResolvedValueOnce({
            data: { success: true },
        });

        render(<UpdateProduct />);
        await waitFor(() => {
            const img = screen.getByAltText("product_photo");
            expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/1");
        });

        fireEvent.click(await screen.findByText("DELETE PRODUCT"));

        expect(axios.delete).toHaveBeenCalledWith(
            "/api/v1/product/delete-product/1"
        )

        await waitFor(()=>expect(mockNavigate).toHaveBeenCalledWith(
            "/dashboard/admin/products"
        ));
    });

    test("shows error toast and does not navigate on failure", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
        });

        axios.post.mockResolvedValueOnce({
            data: { success: false, message: "Bad request" },
        });

        render(<CreateProduct />);

        expect(await screen.findByRole("option", { name: "Electronics" })).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("category-select"), { target: { value: "1" } });
        fireEvent.change(screen.getByPlaceholderText("write a name"), { target: { value: "iPhone" } });

        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());

        await waitFor(() => expect(toast.error).toHaveBeenCalled());
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
