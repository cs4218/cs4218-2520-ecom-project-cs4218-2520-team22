import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import CartPage from "./CartPage";
import toast from "react-hot-toast";
import axios from "axios";

// Mocks
jest.mock("../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

jest.mock("react-hot-toast");

jest.mock("axios");

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) 
}));

jest.mock("../context/cart", () => ({
    useCart: jest.fn(() => [[], jest.fn()])
}));

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
          <CartPage />
      </BrowserRouter>
    );
};

describe("Cart Page renders", () => {
    describe("welcome message", () => {
        it("to guests", async () => {
            renderPage();
    
            await waitFor(() => {
                expect(screen.getByText("Hello Guest")).toBeInTheDocument();
            });
        });
        it("to user", async () => {
            useAuth.mockReturnValueOnce([
                {
                    user: { name: "Test", address: "123 Test St" },
                    token: "testToken",
                },
                jest.fn()
            ]);
            
            renderPage();
    
            await waitFor(() => {
                expect(screen.getByText("Hello Test")).toBeInTheDocument();
            });
        });
    });

    it("cart summary headers", async () => {       
        renderPage();

        await waitFor(() => {
            expect(screen.getByText("Cart Summary")).toBeInTheDocument();
            expect(screen.getByText("Total | Checkout | Payment")).toBeInTheDocument();
            expect(screen.getByText("Total : $0.00")).toBeInTheDocument();
        });
    });

    describe("number of items in cart", () => {  
        it("when cart is empty", async () => {
            useAuth.mockReturnValueOnce([
                {
                    user: { name: "Test", address: "123 Test St" },
                    token: "testToken",
                },
                jest.fn()
            ]);

            renderPage();
    
            await waitFor(() => {
                expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
            });
        });     

        describe("when cart is non-empty", () => {  
            it("for guest", async () => {
                useCart.mockReturnValueOnce([
                    [
                        {   
                            _id: "1",
                            name: "Product 1",
                            description: "Description 1",
                            price: 10,
                            slug: "test",
                            category: "1"
                        }
                    ],
                    jest.fn()
                ]);
    
                renderPage();
        
                await waitFor(() => {
                    expect(screen.getByText("You Have 1 items in your cart please login to checkout!")).toBeInTheDocument();
                });
            });
            it("for user", async () => {
                useAuth.mockReturnValueOnce([
                    {
                        user: { name: "Test", address: "123 Test St" },
                        token: "testToken",
                    },
                    jest.fn()
                ]);
                useCart.mockReturnValueOnce([
                    [
                        {   
                            _id: "1",
                            name: "Product 1",
                            description: "Description 1",
                            price: 10,
                            slug: "test",
                            category: "1"
                        }
                    ],
                    jest.fn()
                ]);
    
                renderPage();
        
                await waitFor(() => {
                    expect(screen.getByText("You Have 1 items in your cart")).toBeInTheDocument();
                });
            });
        });     
    });

    describe("current address", () => {
        it("if present", async () => {
            useAuth.mockReturnValueOnce([
                {
                    user: { name: "Test", address: "123 Test St" },
                    token: "testToken",
                },
                jest.fn()
            ]);

            renderPage();

            await waitFor(async() => {
                expect(await screen.getByText("Current Address")).toBeInTheDocument();
                expect(await screen.getByText("123 Test St")).toBeInTheDocument();
            });
        });

        it("hidden if not present", async () => {
            renderPage();

            await waitFor(async() => {
                expect(await screen.queryByText("Current Address")).not.toBeInTheDocument();
            });
        });
    });

    describe("remove product button", () => {
        it("if cart has at least 1 product", async () => {
            useCart.mockReturnValueOnce([
                [
                    {   
                        _id: "1",
                        name: "Product 1",
                        description: "Description 1",
                        price: 10,
                        slug: "test",
                        category: "1"
                    }
                ],
                jest.fn()
            ]);

            renderPage();

            await waitFor(async() => {
                expect(
                    await screen.findByRole("button", { name: "Remove" })
                ).toBeInTheDocument();
            });
        });

        it("hidden if cart is empty", async () => {
            renderPage();

            await waitFor(async() => {
                expect(
                    await screen.queryByRole("button", { name: "Remove" })
                ).not.toBeInTheDocument();
            });
        });
    });

    it("please login to checkout button", async () => {
        renderPage();

        await waitFor(async() => {
            expect(
                await screen.findByRole("button", { name: "Please Login to checkout" })
            ).toBeInTheDocument();
        });
    });

    it("update address button", async () => {
        useAuth.mockReturnValueOnce([
            {
                user: { name: "Test", address: "123 Test St" },
                token: "testToken",
            },
            jest.fn()
        ]);

        renderPage();

        await waitFor(async() => {
            expect(
                await screen.findByRole("button", { name: "Update Address" })
            ).toBeInTheDocument();
        });
    });
    
    describe("make payment button", () => {
        it("hidden if client token is empty", async () => {
            renderPage();

            await waitFor(async() => {
                expect(
                    await screen.queryByRole("button", { name: "Make Payment" })
                ).not.toBeInTheDocument();
            });
        });

        it("hidden if client token is non-empty but auth token is empty", async () => {
            axios.get.mockResolvedValueOnce((url) => {
                if (url.includes("braintree/token")) {
                    return Promise.resolve({
                        data: {
                            clientToken: 'testToken'
                        }
                    });
                }
            });

            renderPage();

            await waitFor(async() => {
                expect(
                    await screen.queryByRole("button", { name: "Make Payment" })
                ).not.toBeInTheDocument();
            });
        });

        it("hidden if both client and auth token is non-empty but cart is empty", async () => {
            axios.get.mockResolvedValueOnce((url) => {
                if (url.includes("braintree/token")) {
                    return Promise.resolve({
                        data: {
                            clientToken: 'testToken'
                        }
                    });
                }
            });
            useAuth.mockReturnValueOnce([
                {
                    user: { name: "Test", address: "123 Test St" },
                    token: "testToken",
                },
                jest.fn()
            ]);

            renderPage();

            await waitFor(async() => {
                expect(
                    await screen.queryByRole("button", { name: "Make Payment" })
                ).not.toBeInTheDocument();
            });
        });

        it("if client token, auth token and cart is non-empty", async () => {
            axios.get.mockResolvedValueOnce((url) => {
                if (url.includes("braintree/token")) {
                    return Promise.resolve({
                        data: {
                            clientToken: 'testToken'
                        }
                    });
                }
            });
            useAuth.mockReturnValueOnce([
                {
                    user: { name: "Test", address: "123 Test St" },
                    token: "testToken",
                },
                jest.fn()
            ]);
            useCart.mockReturnValueOnce([
                [
                    {   
                        _id: "1",
                        name: "Product 1",
                        description: "Description 1",
                        price: 10,
                        slug: "test",
                        category: "1"
                    }
                ],
                jest.fn()
            ]);

            renderPage();

            await waitFor(async() => {
                expect(
                    await screen.queryByRole("button", { name: "Make Payment" })
                ).not.toBeInTheDocument();
            });
        });
    });

    it("product details in non-empty cart", async () => {
        useCart.mockReturnValueOnce([
            [
                {   
                    _id: "1",
                    name: "Product 1",
                    description: "Description 1",
                    price: 10,
                    slug: "test",
                    category: "1"
                }
            ],
            jest.fn()
        ]);

        renderPage();

        await waitFor(async() => {
            expect(await screen.findByText("Product 1")).toBeInTheDocument();
            expect(await screen.findByText("Description 1")).toBeInTheDocument();
            expect(await screen.findByText("Price: 10")).toBeInTheDocument();
            const img = screen.getByAltText("Product 1");
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/1");
        });
    });
});
