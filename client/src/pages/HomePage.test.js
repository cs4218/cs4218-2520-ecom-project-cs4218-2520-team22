import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import HomePage from "./HomePage";
import toast from "react-hot-toast";
import axios from "axios";

// Mocks
jest.mock("../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

jest.mock("react-hot-toast");

jest.mock("axios");

jest.mock("../context/cart", () => ({
    useCart: jest.fn(() => [[], jest.fn()])
}));

jest.mock("../components/Prices", () => ({
    Prices: [
        { _id: "1", name: "$0 - 19", array: [0, 19] },
        { _id: "2", name: "$20 - 39", array: [20, 39] }
    ],
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate
}));

Object.defineProperty(globalThis, "location", {
    writable: true,
    value: { reload: jest.fn() }
});

let consoleSpy;

beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.clearAllMocks();
});

afterEach(() => {
    consoleSpy.mockRestore();
});

const renderPage = () => {
    render(
      <BrowserRouter>
          <HomePage />
      </BrowserRouter>
    );
};

describe("Home Page renders", () => {
    it("filter sections and title", async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText("Filter By Category")).toBeInTheDocument();
            expect(screen.getByText("Filter By Price")).toBeInTheDocument();
            expect(screen.getByText("All Products")).toBeInTheDocument();
        })
    });

    it("the banner image with correct src and alt", async () => {
        renderPage();

        await waitFor(() => {
            const img = screen.getByAltText("bannerimage");
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute("src", "/images/Virtual.png");
        })
    });

    it("filter and product buttons", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("product-list")) {
                return Promise.resolve({ 
                    data: { 
                        products: [
                            {
                                _id: "1",
                                name: "Product 1",
                                description: "Description 1",
                                price: 10,
                                slug: "test"
                            }
                        ] 
                    } 
                });
            }
            return Promise.resolve({ data: {} });
        });

        renderPage();

        await waitFor(async () => {
            expect(
                await screen.getByRole("button", { name: "RESET FILTERS" })
            ).toBeInTheDocument();
            expect(
                await screen.findByRole("button", { name: "ADD TO CART" })
            ).toBeInTheDocument();
            expect(
                await screen.findByRole("button", { name: "More Details" })
            ).toBeInTheDocument();
        })
    });

    describe("load more button", () => {
        it("fails when product is null", async () => {
            axios.get.mockImplementation((url) => {
                if (url.includes("product-list")) {
                    return Promise.resolve({ 
                        data: { 
                            products: null
                        } 
                    });
                }
                return Promise.resolve({ data: {} });
            });

            renderPage();

            await waitFor(() => {
                expect(
                    screen.queryByRole("button", { name: "Loadmore" })
                ).not.toBeInTheDocument();
            });
        });

        it("fails when product length >= total", async () => {
            axios.get.mockImplementation((url) => {
                if (url.includes("product-list")) {
                    return Promise.resolve({ 
                        data: { 
                            products:  [
                                {
                                    _id: "1",
                                    name: "Product 1",
                                    description: "Description 1",
                                    price: 10,
                                    slug: "test"
                                }
                            ] 
                        } 
                    });
                }
                if (url.includes("product-count")) {
                    return Promise.resolve({ data: { total: 0 } });
                }
                return Promise.resolve({ data: {} });
            });

            renderPage();

            await waitFor(() => {
                expect(
                    screen.queryByRole("button", { name: "Loadmore" })
                ).not.toBeInTheDocument();
            });
        });

        it("when product is not null and product length < total", async () => {
            axios.get.mockImplementation((url) => {
                if (url.includes("product-list")) {
                    return Promise.resolve({ 
                        data: { 
                            products:  [
                                {
                                    _id: "1",
                                    name: "Product 1",
                                    description: "Description 1",
                                    price: 10,
                                    slug: "test"
                                }
                            ] 
                        } 
                    });
                }
                if (url.includes("product-count")) {
                    return Promise.resolve({ data: { total: 2 } });
                }
                return Promise.resolve({ data: {} });
            });

            renderPage();

            await waitFor(async () => {
                const button = await screen.findByRole("button", { name: "Loadmore" });
                expect(button).toBeInTheDocument();
                const icon = button.querySelector("svg");
                expect(icon).toBeInTheDocument()
            })
        });
    });

    describe("categories", () => {
        it("successfully" , async () => {
            axios.get.mockImplementation((url) => {
                if (url.includes("get-category")) {
                    return Promise.resolve({ 
                        data: {
                            success: true,
                            category: [
                                { _id: "1", name: "Category 1" },
                                { _id: "2", name: "Category 2" },
                            ]
                        }
                    });
                }
                return Promise.resolve({ data: {} });
            });

            renderPage();

            await waitFor(async() => {
                expect(await screen.findByText("Category 1")).toBeInTheDocument();
                expect(await screen.findByText("Category 2")).toBeInTheDocument();
            });
        });

        it("unsuccessfully due to api call error" , async () => {
            axios.get.mockImplementation((url) => {
                if (url.includes("get-category")) {
                    return Promise.reject(new Error("Test Error"));
                }
                return Promise.resolve({ data: {} });
            });

            renderPage();

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            });
        });
    });

    
    describe("products", () => {
        it("successfully, showing product's image and details" , async () => {
            axios.get.mockImplementation((url) => {
                if (url.includes("product-list")) {
                    return Promise.resolve({ 
                        data: {
                            products:  [
                                {
                                    _id: "1",
                                    name: "Product 1",
                                    description: "Description 1",
                                    price: 10,
                                    slug: "test"
                                }
                            ] 
                        }
                    });
                }
                return Promise.resolve({ data: {} });
            });

            renderPage();

            await waitFor(async () => {
                expect(await screen.findByText("Product 1")).toBeInTheDocument();
                expect(await screen.findByText("Description 1...")).toBeInTheDocument();
                expect(await screen.findByText("$10.00")).toBeInTheDocument();
                const img = screen.getByAltText("Product 1");
                expect(img).toBeInTheDocument();
                expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/1");
            })
        });

        it("unsuccessfully due to api call error" , async () => {
            axios.get.mockImplementation((url) => {
                if (url.includes("product-list")) {
                    return Promise.reject(new Error("Test Error"));
                }
                return Promise.resolve({ data: {} });
            });

            renderPage();

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            });
        });
    });

    it("prices", async () => {
        renderPage();

        expect(await screen.findByText("$0 - 19")).toBeInTheDocument();
        expect(await screen.findByText("$20 - 39")).toBeInTheDocument();
    });
});

describe("Home Page fetches product total count via api call", () => {
    it("successfully", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("product-count")) {
                return Promise.resolve({ data: { total: 1 } });
            }
            return Promise.resolve({ data: {} });
        });

        renderPage();

        await waitFor(() => {
            expect(consoleSpy).not.toHaveBeenCalledWith(expect.any(Error));
        });
    });
    it("unsuccessfully", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("product-count")) {
                return Promise.reject(new Error("Test Error"));
            }
            return Promise.resolve({ data: {} });
        });

        renderPage();

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});

describe("Home Page triggers load more button", () => {
    it("loads more products when page > 1", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("product-count")) {
                return Promise.resolve({ data: { total: 1 } });
            }
            if (url.includes("product-list/2")) {
                return Promise.resolve({ 
                    data: {
                        products:  [
                            {
                                _id: "1",
                                name: "Product 1",
                                description: "Description 1",
                                price: 10,
                                slug: "test"
                            }
                        ] 
                    }
                });
            }
            if (url.includes("product-list")) {
                return Promise.resolve({ 
                    data: { products:  [] }
                });
            }
            return Promise.resolve({ data: {} });
        });

        renderPage();

        const load = await screen.findByRole("button", { name: "Loadmore" });
        fireEvent.click(load);
        await waitFor(async () => {
            expect(await screen.findByText("Product 1")).toBeInTheDocument();
        });
    });
    
    it("failed", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("product-count")) {
                return Promise.resolve({ data: { total: 1 } });
            }
            if (url.includes("product-list/2")) {
                return Promise.reject(new Error("Test Error"));
            }
            if (url.includes("product-list")) {
                return Promise.resolve({ 
                    data: { products:  [] }
                });
            }
            return Promise.resolve({ data: {} });
        });

        renderPage();

        const load = await screen.findByRole("button", { name: "Loadmore" });
        fireEvent.click(load);
        await waitFor(async () => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });
})

describe("Home Page filter products api is", () => {
    it("called when both category and price is checked", async() => {
        axios.get.mockImplementation((url) => {
            if (url.includes("get-category")) {
                return Promise.resolve({ 
                    data: {
                        success: true,
                        category: [
                            { _id: "1", name: "Category 1" },
                            { _id: "2", name: "Category 2" },
                        ]
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });

        renderPage();

        const selectedCategory = await screen.findByText("Category 1");
        fireEvent.click(selectedCategory);
        const selectedPrice = await screen.findByText("$0 - 19");
        fireEvent.click(selectedPrice);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
				"/api/v1/product/product-filters",
				expect.objectContaining({ checked: ["1"], radio: [0, 19] })
			);
        });
    });

    it("called when only category is checked", async() => {
        axios.get.mockImplementation((url) => {
            if (url.includes("get-category")) {
                return Promise.resolve({ 
                    data: {
                        success: true,
                        category: [
                            { _id: "1", name: "Category 1" },
                            { _id: "2", name: "Category 2" },
                        ]
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });

        renderPage();

        const selectedCategory = await screen.findByText("Category 1");
        fireEvent.click(selectedCategory);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
				"/api/v1/product/product-filters",
				expect.objectContaining({ checked: ["1"], radio: [] })
			);
        });
    });

    it("called when only price is checked", async() => {
        axios.get.mockImplementation((url) => {
            return Promise.resolve({ data: {} });
        });

        renderPage();

        const selectedPrice = await screen.findByText("$0 - 19");
        fireEvent.click(selectedPrice);
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
				"/api/v1/product/product-filters",
				expect.objectContaining({ checked: [], radio: [0, 19] })
			);
        });
    });

    it("not called when both category and price are not checked", async() => {
        renderPage();

        await waitFor(() => {
            expect(axios.post).not.toHaveBeenCalled();
        });
    });

    it("called successfully", async() => {
        axios.get.mockImplementation((url) => {
            if (url.includes("get-category")) {
                return Promise.resolve({ 
                    data: {
                        success: true,
                        category: [
                            { _id: "1", name: "Category 1" }
                        ]
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });
        axios.post.mockResolvedValueOnce({
            data: {
                products: [
                    {   
                        _id: "1",
                        name: "Product 1",
                        description: "Description 1",
                        price: 10,
                        slug: "test",
                        category: "1"
                    },
                ],
            },
        })
        renderPage();

        const selectedCategory = await screen.findByText("Category 1");
        fireEvent.click(selectedCategory);
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(await screen.findByText("Product 1")).toBeInTheDocument();
    });

    it("is called unsuccessfully", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("get-category")) {
                return Promise.resolve({ 
                    data: {
                        success: true,
                        category: [
                            { _id: "1", name: "Category 1" }
                        ]
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });
        axios.post.mockRejectedValueOnce(new Error("Test Error"));

        renderPage();

        const selectedCategory = await screen.findByText("Category 1");
        fireEvent.click(selectedCategory);
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
});

it("Home Page handles add to cart successfully", async () => {
    axios.get.mockImplementation((url) => {
        if (url.includes("product-list")) {
            return Promise.resolve({ 
                data: { 
                    products: [
                        {
                            _id: "1",
                            name: "Product 1",
                            description: "Description 1",
                            price: 10,
                            slug: "test"
                        }
                    ] 
                } 
            });
        }
        return Promise.resolve({ data: {} });
    });
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    renderPage();
    const addBtn = await screen.findByRole("button", { name: "ADD TO CART" });
    fireEvent.click(addBtn);

    await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
    });

    setItemSpy.mockRestore();
});

it("Home Page redirects to product details page when click on more details button", async () => {
    axios.get.mockImplementation((url) => {
        if (url.includes("product-list")) {
            return Promise.resolve({ 
                data: { 
                    products: [
                        {
                            _id: "1",
                            name: "Product 1",
                            description: "Description 1",
                            price: 10,
                            slug: "test"
                        }
                    ] 
                } 
            });
        }
        return Promise.resolve({ data: {} });
    });

    renderPage();

    const moreDetails = await screen.findByRole("button", { name: "More Details" })
    fireEvent.click(moreDetails);

    await waitFor(async () => {
        expect(mockNavigate).toHaveBeenCalledWith("/product/test");
    });
});

it("Home Page calls reloads window when click on reset filters button", async () => {
    axios.get.mockImplementation((url) => {
        return Promise.resolve({ data: {} });
    });

    renderPage();

    const button = screen.getByRole("button", { name: "RESET FILTERS" });
    fireEvent.click(button);

    await waitFor(async () => {
        expect(globalThis.location.reload).toHaveBeenCalled();
    });
});
