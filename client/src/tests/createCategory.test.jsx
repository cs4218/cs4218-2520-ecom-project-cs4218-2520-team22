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
    console.log("MOCK CategoryForm used", props);
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

    test("loads categories on mount", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "1", name: "Books" }] },
        });

        render(<CreateCategory />);

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"));
        expect(await screen.findByText("Books")).toBeInTheDocument();
    });

    test("creates category and refreshes list", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [] },
        });
        axios.post.mockResolvedValueOnce({
            data: { success: true },
        });
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: [{ _id: "2", name: "Games" }] },
        });

        render(<CreateCategory />);

        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        fireEvent.change(screen.getByLabelText("create-category-input"), {
            target: { value: "Games" },
        });
        fireEvent.click(screen.getByLabelText("create-category-input-submit"));

        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "Games" })
        );
        await waitFor(() =>
            expect(toast.success).toHaveBeenCalledWith("Games is created")
        );

        await waitFor(() =>
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
        );
        expect(await screen.findByText("Games")).toBeInTheDocument();
    });

    test("opens edit modal, updates category, closes modal, refreshes list", async () => {
        axios.get
            .mockResolvedValueOnce({
                data: { success: true, category: [{ _id: "1", name: "Books" }] },
            })
            .mockResolvedValueOnce({
                data: { success: true, category: [{ _id: "1", name: "Novels" }] },
            });

        axios.put.mockResolvedValueOnce({ data: { success: true } });

        render(<CreateCategory />);
        expect(await screen.findByText("Books")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Edit"));
        expect(await screen.findByText("Modal")).toBeInTheDocument();

        const input = screen.getByLabelText("update-category-input");
        expect(input).toHaveValue("Books");

        fireEvent.change(input, { target: { value: "Novels" } });

        // 点 modal 的 submit（别点到创建表单那个）
        fireEvent.click(screen.getAllByText("Submit")[1]);

        await waitFor(() =>
            expect(axios.put).toHaveBeenCalledWith(
                "/api/v1/category/update-category/1",
                { name: "Novels" }
            )
        );
        await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Novels is updated")
        );
        // 确认刷新发生
        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

        expect(await screen.findByText("Novels")).toBeInTheDocument();

        // 可选：确认 modal 关闭（如果你 mock 的 Modal 支持）
        await waitFor(() =>
            expect(screen.queryByText("Modal")).not.toBeInTheDocument()
        );
    });

    test("deletes category and refreshes list", async () => {
        axios.get
            .mockResolvedValueOnce({
                data: { success: true, category: [{ _id: "1", name: "Books" }] },
            })
            .mockResolvedValueOnce({
                data: { success: true, category: [] },
            });

        axios.delete.mockResolvedValueOnce({
            data: { success: true },
        });


        render(<CreateCategory />);
        expect(await screen.findByText("Books")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Delete"));
        await waitFor(() => expect(axios.delete).toHaveBeenCalled());
        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Category deleted successfully"));

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"));
    });
});
