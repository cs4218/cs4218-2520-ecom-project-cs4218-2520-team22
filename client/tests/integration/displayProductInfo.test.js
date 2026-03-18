/**
 * Test interactions between ProductDetails page and getProductController
 *
 * Navigating to "/product/:slug" should:
 * - send a request to /api/v1/product/get-product/:slug
 * - call the getProductController with the correct information
 * - display the information returned by getProductController on the page
 */

import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import * as productController from "../../../controllers/productController";
import ProductDetails from "../../src/pages/ProductDetails";

jest.mock(
  "axios",
  () => ({
    __esModule: true,
    default: {
      get: jest.fn(),
    },
  }),
  { virtual: true },
);

jest.mock("../../../controllers/productController", () => ({
  __esModule: true,
  getSingleProductController: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../../src/components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../src/context/cart", () => ({
  useCart: () => [[], jest.fn()],
}));

describe("display product info flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: "galaxy-s24" });
    useNavigate.mockReturnValue(jest.fn());
  });

  it("requests product by slug, invokes controller with slug, and renders returned details", async () => {
    const slug = "galaxy-s24";
    const mockProduct = {
      _id: "p1",
      name: "Galaxy S24",
      description: "Flagship Android phone",
      price: 999,
      category: {
        _id: "c1",
        name: "Phones",
      },
    };

    productController.getSingleProductController.mockImplementation(
      async (req, res) => {
        res.status(200).send({
          success: true,
          message: "Single Product Fetched",
          product: mockProduct,
        });
      },
    );

    axios.get.mockImplementation(async (url) => {
      if (url === `/api/v1/product/get-product/${slug}`) {
        const req = { params: { slug } };
        const res = {
          statusCode: null,
          payload: null,
          status(code) {
            this.statusCode = code;
            return this;
          },
          send(body) {
            this.payload = body;
            return this;
          },
        };

        await productController.getSingleProductController(req, res);
        return { data: res.payload };
      }

      if (url.startsWith("/api/v1/product/related-product/")) {
        return { data: { products: [] } };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    render(<ProductDetails />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/${slug}`,
      );
    });

    expect(productController.getSingleProductController).toHaveBeenCalledWith(
      expect.objectContaining({ params: { slug } }),
      expect.any(Object),
    );

    expect(
      await screen.findByText(/Name\s*:\s*Galaxy S24/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Description\s*:\s*Flagship Android phone/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Category\s*:\s*Phones/i)).toBeInTheDocument();
  });
});
