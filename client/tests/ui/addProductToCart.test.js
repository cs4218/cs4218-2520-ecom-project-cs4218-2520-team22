/**
 * User navigates to "/product/:slug"
 * Adds the product to cart
 * Adds a related product to cart
 * Clicks on the cart link in the header
 * Should see the two products on the cart page
 */

import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test("user adds product and related product to cart and sees both in cart page", async ({
  page,
}) => {
  const slug = "galaxy-s24";

  const mainProduct = {
    _id: "p-main",
    name: "Galaxy S24",
    description: "Flagship Android phone",
    price: 999,
    slug,
    category: {
      _id: "c1",
      name: "Phones",
    },
  };

  const relatedProduct = {
    _id: "p-rel-1",
    name: "Galaxy Buds",
    description: "Wireless earbuds",
    price: 149,
    slug: "galaxy-buds",
    category: {
      _id: "c1",
      name: "Phones",
    },
  };

  await page.route("**/api/v1/category/get-category", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ category: [] }),
    });
  });

  await page.route("**/api/v1/product/get-product/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        product: mainProduct,
      }),
    });
  });

  await page.route("**/api/v1/product/related-product/*/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        products: [relatedProduct],
      }),
    });
  });

  await page.route("**/api/v1/product/braintree/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ clientToken: "" }),
    });
  });

  await page.goto(`${BASE_URL}/product/${slug}`);

  await expect(page.getByText("Product Details")).toBeVisible();
  await expect(page.getByText("Galaxy Buds")).toBeVisible();

  const addToCartButtons = page.getByRole("button", { name: "ADD TO CART" });
  await addToCartButtons.first().click();
  await addToCartButtons.nth(1).click();

  await page.getByRole("link", { name: "Cart" }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText("Galaxy S24")).toBeVisible();
  await expect(page.getByText("Galaxy Buds")).toBeVisible();
});
