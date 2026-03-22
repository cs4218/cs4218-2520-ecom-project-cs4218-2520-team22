/**
 * User navigates to "/category/:slug"
 * Is shown list of products belonging to category
 * Clicks on the more details button on a product
 * Should be taken to the product's page and shown more details for that product
 */

import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test("user opens a category product and is navigated to its product details page", async ({
  page,
}) => {
  const categorySlug = "phones";
  const productSlug = "iphone-15";

  const category = {
    _id: "c1",
    name: "Phones",
    slug: categorySlug,
  };

  const product = {
    _id: "p-cat-1",
    name: "iPhone 15",
    description: "Apple smartphone",
    price: 1199,
    slug: productSlug,
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

  await page.route("**/api/v1/product/get-product/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        product,
      }),
    });
  });

  await page.route("**/api/v1/product/related-product/*/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        products: [],
      }),
    });
  });

  await page.goto(`${BASE_URL}/category/${categorySlug}`);

  await expect(page.getByText("Category - Phones")).toBeVisible();
  await expect(page.getByText("iPhone 15")).toBeVisible();

  await page.getByRole("button", { name: "More Details" }).first().click();

  await expect(page).toHaveURL(new RegExp(`/product/${productSlug}$`));
  await expect(page.getByText("Product Details")).toBeVisible();
  await expect(page.getByText("Name : iPhone 15")).toBeVisible();
  await expect(page.getByText("Description : Apple smartphone")).toBeVisible();
  await expect(page.getByText("Category : Phones")).toBeVisible();
});
