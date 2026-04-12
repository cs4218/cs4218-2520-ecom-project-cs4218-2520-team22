// Written by Qinzhe Wang A0337880U
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateCategory from "../pages/admin/CreateCategory";
import axios from "axios";
import toast from "react-hot-toast";

/* =======================
   mocks
   ======================= */
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("./../components/AdminMenu", () => () => <div>AdminMenu</div>);

jest.mock("../components/Form/CategoryForm", () => (props) => {
    const { value, setValue, handleSubmit, ariaLabel } = props;
    return (
        <form onSubmit={handleSubmit}>
            <input
                aria-label={ariaLabel}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit" aria-label={`${ariaLabel}-submit`}>Submit</button>
        </form>
    );
});

jest.mock("antd", () => ({
    Modal: ({ visible, children, onCancel }) =>
        visible ? (
            <div>
                <div>Modal</div>
                <button onClick={onCancel}>Close</button>
                {children}
            </div>
        ) : null,
}));

describe("CreateCategory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("loads and displays categories on mount", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "1", name: "Books" }] },
        });

        render(<CreateCategory />);

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"));
        expect(await screen.findByText("Books")).toBeInTheDocument();
    });

    test("creates a new category and refreshes the list", async () => {
        axios.get
            .mockResolvedValueOnce({ data: { success: true, category: [] } })
            .mockResolvedValueOnce({ data: { success: true, category: [{ _id: "2", name: "Games" }] } });
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        render(<CreateCategory />);
        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        fireEvent.change(screen.getByLabelText("create-category-input"), {
            target: { value: "Games" },
        });
        fireEvent.click(screen.getByLabelText("create-category-input-submit"));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "Games" })
        );
        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Games is created"));
        expect(await screen.findByText("Games")).toBeInTheDocument();
    });

    test("opens edit modal, updates category, closes modal, and refreshes the list", async () => {
        axios.get
            .mockResolvedValueOnce({ data: { success: true, category: [{ _id: "1", name: "Books" }] } })
            .mockResolvedValueOnce({ data: { success: true, category: [{ _id: "1", name: "Novels" }] } });
        axios.put.mockResolvedValueOnce({ data: { success: true } });

        render(<CreateCategory />);
        expect(await screen.findByText("Books")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Edit"));
        expect(await screen.findByText("Modal")).toBeInTheDocument();

        const input = screen.getByLabelText("update-category-input");
        expect(input).toHaveValue("Books");
        fireEvent.change(input, { target: { value: "Novels" } });
        fireEvent.click(screen.getAllByText("Submit")[1]);

        await waitFor(() =>
            expect(axios.put).toHaveBeenCalledWith(
                "/api/v1/category/update-category/1",
                { name: "Novels" }
            )
        );
        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Novels is updated"));
        await waitFor(() => expect(screen.queryByText("Modal")).not.toBeInTheDocument());
        expect(await screen.findByText("Novels")).toBeInTheDocument();
    });

    test("deletes a category and refreshes the list", async () => {
        axios.get
            .mockResolvedValueOnce({ data: { success: true, category: [{ _id: "1", name: "Books" }] } })
            .mockResolvedValueOnce({ data: { success: true, category: [] } });
        axios.delete.mockResolvedValueOnce({ data: { success: true } });

        render(<CreateCategory />);
        expect(await screen.findByText("Books")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Delete"));

        await waitFor(() => expect(axios.delete).toHaveBeenCalled());
        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Category deleted successfully"));
        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"));
    });

    test("shows a generic error toast and logs the error when deletion fails", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
        });
        axios.delete.mockRejectedValueOnce({
            response: { data: { success: false, message: "Cannot delete category with existing products. Please reassign or delete the products first." } },
        });
        jest.spyOn(console, "log").mockImplementation(() => {});

        render(<CreateCategory />);
        expect(await screen.findByText("Electronics")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Delete"));

        await waitFor(() => expect(axios.delete).toHaveBeenCalled());
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
        expect(console.log).toHaveBeenCalled();
    });
});
