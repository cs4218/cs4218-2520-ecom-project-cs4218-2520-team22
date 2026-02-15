import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../context/cart";

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        clear: jest.fn(() => { store = {}; })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

describe("CartProvider", () => {
    it("renders empty cart if localStorage is empty", () => {
        localStorage.getItem.mockReturnValueOnce(JSON.stringify([]));
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider,
        });

        const [cart] = result.current;

        expect(cart).toEqual([]);
    });

    it("renders non-empty cart if localStorage is non-empty", () => {
        const mockCart = [
            {   
                _id: "1",
                name: "Product 1",
                description: "Description 1",
                price: 10,
                slug: "test",
                category: "1"
            }
        ]
        localStorage.setItem("cart", JSON.stringify(mockCart))
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider,
        });

        const [cart] = result.current;

        expect(localStorage.getItem).toHaveBeenCalledWith("cart");
        expect(cart).toEqual(mockCart);
    }); 

    it("updates cart when setCart is called", () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider,
        });

        const [, setCart] = result.current;

        const mockCart = [
            {   
                _id: "1",
                name: "Product 1",
                description: "Description 1",
                price: 10,
                slug: "test",
                category: "1"
            }
        ]

        act(() => {
            setCart(mockCart);
        });

        const [updatedCart] = result.current;

        expect(updatedCart).toEqual(mockCart);
    });
});
