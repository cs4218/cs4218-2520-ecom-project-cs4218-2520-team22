import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryForm from "../components/Form/CategoryForm";
/* =======================
   tests
   ======================= */
describe("CategoryForm", () => {
    test("calls setValue when typing in the input", () => {
        const handleSubmit = jest.fn((e) => e.preventDefault());
        const setValue = jest.fn();

        render(
            <CategoryForm
                handleSubmit={handleSubmit}
                value=""
                setValue={setValue}
            />
        );

        const input = screen.getByPlaceholderText("Enter new category");
        fireEvent.change(input, { target: { value: "Electronics" } });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith("Electronics");
    });

    test("calls handleSubmit when form is submitted", () => {
        const handleSubmit = jest.fn((e) => e.preventDefault());
        const setValue = jest.fn();

        render(
            <CategoryForm
                handleSubmit={handleSubmit}
                value="Books"
                setValue={setValue}
            />
        );

        const btn = screen.getByRole("button", { name: "Submit" });
        fireEvent.click(btn);

        expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    test("renders the controlled input value", () => {
        const handleSubmit = jest.fn((e) => e.preventDefault());
        const setValue = jest.fn();

        render(
            <CategoryForm
                handleSubmit={handleSubmit}
                value="Clothes"
                setValue={setValue}
            />
        );

        const input = screen.getByPlaceholderText("Enter new category");
        expect(input).toHaveValue("Clothes");
    });
});
