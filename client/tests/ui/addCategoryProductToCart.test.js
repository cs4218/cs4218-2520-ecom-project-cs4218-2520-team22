/**
 * User navigates to "/category/:slug"
 * Adds product to cart
 * Clicks on the cart link in header
 * Should see the product on the cart page
 */

import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test("user adds category product to cart and sees it on cart page", async ({
  page,
}) => {
  const slug = "phones";

  const category = {
    _id: "c1",
    name: "Phones",
    slug,
  };

  const product = {
    _id: "p-cat-1",
    name: "iPhone 15",
    description: "Apple smartphone",
    price: 1199,
    slug: "iphone-15",
    category,
  };

  await page.route("**/api/v1/category/get-category", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ category: [category] }),
    });
  });

  await page.route("**/api/v1/product/product-category/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        category,
        products: [product],
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

  await page.goto(`${BASE_URL}/category/${slug}`);

  await expect(page.getByText("Category - Phones")).toBeVisible();
  await expect(page.getByText("iPhone 15")).toBeVisible();

  await page.getByRole("button", { name: "ADD TO CART" }).click();
  await page.getByRole("link", { name: "Cart" }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText("iPhone 15")).toBeVisible();
});
