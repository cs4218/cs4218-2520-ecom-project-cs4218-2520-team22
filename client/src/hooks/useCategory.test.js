import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import useCategory from './useCategory';

jest.mock('axios');

let consoleSpy;

beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.clearAllMocks();
});

afterEach(() => {
    consoleSpy.mockRestore();
});

describe("useCategory hook returns", () => {
    it("non-empty category list successfully", async () => {
        const mockCategories = [ { _id: "1", name: "Test", slug: "Test" } ]
        axios.get.mockResolvedValueOnce({
            data: {
                category: mockCategories
            }
        });
    
        const { result } = renderHook(() => useCategory());
    
        await waitFor(() => {
            expect(result.current).toEqual(mockCategories);
        });
    });

    it("empty category list successfully", async () => {
        const mockCategories = []
        axios.get.mockResolvedValueOnce({
            data: {
                category: mockCategories
            }
        });
    
        const { result } = renderHook(() => useCategory());
    
        await waitFor(() => {
            expect(result.current).toEqual(mockCategories);
        });
    });

    it("error due to unsuccessful api call", async () => {
        axios.get.mockRejectedValueOnce(new Error("Test Error"));
    
        renderHook(() => useCategory());
    
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});

it("useCategory calls api on mount", async () => {
    renderHook(() => useCategory());

    await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
});
