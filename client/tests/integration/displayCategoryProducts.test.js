/**
 * Test interactions between CategoryProduct page and productCategoryController
 *
 * Navigating to “/category/:slug” should:
 * - send a request to /api/v1/product/product-category/:slug
 * - call the categoryProductController with the correct information
 * - display the information returned by categoryProductController on the page
 */

import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import * as productController from "../../../controllers/productController";
import CategoryProduct from "../../src/pages/CategoryProduct";

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
  productCategoryController: jest.fn(),
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

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
  },
}));

describe("display category products flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: "phones" });
    useNavigate.mockReturnValue(jest.fn());
  });

  it("requests category products, invokes controller with slug, and renders returned category products", async () => {
    const slug = "phones";
    const category = {
      _id: "c1",
      name: "Phones",
      slug,
    };
    const products = [
      {
        _id: "p1",
        name: "Galaxy S24",
        description: "Flagship Android phone with excellent camera",
        price: 999,
        slug: "galaxy-s24",
      },
    ];

    productController.productCategoryController.mockImplementation(
      async (req, res) => {
        res.status(200).send({
          success: true,
          category,
          products,
        });
      },
    );

    axios.get.mockImplementation(async (url) => {
      if (url === `/api/v1/product/product-category/${slug}`) {
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

        await productController.productCategoryController(req, res);
        return { data: res.payload };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    render(<CategoryProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/product-category/${slug}`,
      );
    });

    expect(productController.productCategoryController).toHaveBeenCalledWith(
      expect.objectContaining({ params: { slug } }),
      expect.any(Object),
    );

    expect(
      await screen.findByText(/Category\s*-\s*Phones/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 result found/i)).toBeInTheDocument();
    expect(screen.getByText(/Galaxy S24/i)).toBeInTheDocument();
    expect(screen.getByText(/\$999\.00/i)).toBeInTheDocument();
  });
});
