import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import Categories from "./Categories.js";

// Mocks
jest.mock("../components/Layout", () => ({
    __esModule: true,
    default: ({ title, children }) => (
        <div>
            <h1>{title}</h1>
            {children}
        </div>
    )
}));

jest.mock('../hooks/useCategory', () => ({
    __esModule: true,
    default: jest.fn()
}));


const renderPage = () => {
    render(
      <BrowserRouter>
          <Categories />
      </BrowserRouter>
    );
};

describe("Categories Page renders", () => {
    it("title", async () => {
        useCategory.mockReturnValueOnce([]);
        renderPage();

        await waitFor(() => {
            expect(screen.getByText("All Categories")).toBeInTheDocument();
        });
    });
    
    it("category buttons when category list is non-empty", async () => {
        useCategory.mockReturnValueOnce([
            {     
                _id: 1,
                name: "Test",
                slug: "Test"    
            },
            {     
                _id: 2,
                name: "Test2",
                slug: "Test2"    
            }
        ]);

        renderPage();

        await waitFor(async () => {
            expect(await screen.findByRole("link", { name: "Test" })).toBeInTheDocument();
            expect(await screen.findByRole("link", { name: "Test2" })).toBeInTheDocument();
        });
    })

    it("an empty page when category list is empty", async () => {
        useCategory.mockReturnValueOnce([]);

        renderPage();

        await waitFor(async () => {
            expect(await screen.queryAllByRole("link")).toHaveLength(0);
        });
    });
});

it("Category Page contains correct links for redirection to Category Page", async() => {
    useCategory.mockReturnValueOnce([
        {    
            _id: 1, 
            name: "Test",
            slug: "Test"    
        }
    ]);

    renderPage();

    await waitFor(async() => {
        expect(await screen.findByRole("link", { name: "Test" })).toHaveAttribute("href", "/category/Test");
    });
});
