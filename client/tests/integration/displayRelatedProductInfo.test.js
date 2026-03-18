/**
 * Test interactions between ProductDetails page and relatedProductController
 *
 * Navigating to “/product/:slug” should:
 * - send a request to /api/v1/product/related-product/:pid/:cid
 * - call the relatedProductController with the correct information
 * - display the information returned by relatedProductController on the page
 */

import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import * as productController from "../../../controllers/productController";
import ProductDetails from "../../src/pages/ProductDetails";

const mockNavigate = jest.fn();

jest.mock(
  "axios",
  () => ({
    __esModule: true,
    default: {
      get: jest.fn(),
    },
  }),
);

jest.mock("../../../controllers/productController", () => ({
  __esModule: true,
  getSingleProductController: jest.fn(),
  relatedProductController: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "galaxy-s24" }),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../src/components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../src/context/cart", () => ({
  useCart: () => [[], jest.fn()],
}));

describe("display related product info flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests related products, invokes controller with pid/cid, and renders related product details", async () => {
    const slug = "galaxy-s24";
    const product = {
      _id: "p1",
      name: "Galaxy S24",
      description: "Flagship Android phone",
      price: 999,
      category: {
        _id: "c1",
        name: "Phones",
      },
    };

    const relatedProducts = [
      {
        _id: "p2",
        name: "Galaxy Buds",
        description: "Wireless earbuds with noise cancellation",
        price: 149,
        slug: "galaxy-buds",
      },
    ];

    productController.getSingleProductController.mockImplementation(
      async (req, res) => {
        res.status(200).send({
          success: true,
          message: "Single Product Fetched",
          product,
        });
      },
    );

    productController.relatedProductController.mockImplementation(
      async (req, res) => {
        res.status(200).send({
          success: true,
          products: relatedProducts,
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

      if (url === "/api/v1/product/related-product/p1/c1") {
        const req = { params: { pid: "p1", cid: "c1" } };
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

        await productController.relatedProductController(req, res);
        return { data: res.payload };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    render(<ProductDetails />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/p1/c1",
      );
    });

    expect(productController.relatedProductController).toHaveBeenCalledWith(
      expect.objectContaining({ params: { pid: "p1", cid: "c1" } }),
      expect.any(Object),
    );

    expect(await screen.findByText(/Galaxy Buds/i)).toBeInTheDocument();
    expect(screen.getByText(/\$149\.00/i)).toBeInTheDocument();
  });
});
