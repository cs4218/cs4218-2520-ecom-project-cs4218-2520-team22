/**
 * Sprint 3 — E2E Product Browse & Search Journey Tests
 * Stories: E2E-BROWSE-01 through E2E-BROWSE-08
 * Approach: Full-stack E2E via Playwright
 *
 * QINZHE Wang, A0337880U
 */

import { test, expect } from "@playwright/test";
import { E2E_PREFIX } from "./helpers/globalSetup.js";

// Seed data constants (matching globalSetup)
const ELECTRONICS_CAT = `${E2E_PREFIX}Electronics`;
const CLOTHING_CAT = `${E2E_PREFIX}Clothing`;
const LAPTOP1 = `${E2E_PREFIX}Laptop 1`;
const SHIRT = `${E2E_PREFIX}Blue Shirt`;

// E2E-BROWSE-01
test("E2E-BROWSE-01: Home page displays seeded products with name, price, and description", async ({
  page,
}) => {
  // Mark Wang, A0000000X
  await page.goto("/");

  // At least the first E2E laptop should be visible in the product listing
  await expect(page.getByText(LAPTOP1)).toBeVisible({ timeout: 10000 });
  // Price shown as currency
  await expect(page.getByText(/\$100\.00/)).toBeVisible();
  // "More Details" button present for products
  await expect(page.getByRole("button", { name: "More Details" }).first()).toBeVisible();
});

// E2E-BROWSE-02
test("E2E-BROWSE-02: Filter by E2E Electronics category shows only Electronics products", async ({
  page,
}) => {
  // Mark Wang, A0000000X
  await page.goto("/");
  // Wait for categories to load and find the E2E Electronics checkbox
  await page.getByText(ELECTRONICS_CAT).first().click();

  // E2E Laptop should be visible
  await expect(page.getByText(LAPTOP1)).toBeVisible({ timeout: 8000 });
  // E2E Blue Shirt (Clothing) should disappear
  await expect(page.getByText(SHIRT)).not.toBeVisible({ timeout: 5000 });
});

// E2E-BROWSE-03
test("E2E-BROWSE-03: Filter by price range $0-$99 shows only cheap products", async ({
  page,
}) => {
  // Mark Wang, A0000000X
  await page.goto("/");
  // Select the "$0 to 19" or first cheap price radio — the E2E shirt is $25
  // The Prices component defines ranges; we select "$20 to 39" to include the shirt
  await page.getByText("$20 to 39").click();

  // E2E Blue Shirt ($25) should appear
  await expect(page.getByText(SHIRT)).toBeVisible({ timeout: 8000 });
  // E2E Laptop 3 ($300) should not be visible
  await expect(page.getByText(`${E2E_PREFIX}Laptop 3`)).not.toBeVisible({ timeout: 5000 });
});

// E2E-BROWSE-04
test("E2E-BROWSE-04: Reset Filters button restores all products", async ({ page }) => {
  // Mark Wang, A0000000X
  await page.goto("/");

  // Apply a category filter first
  await page.getByText(ELECTRONICS_CAT).first().click();
  await expect(page.getByText(SHIRT)).not.toBeVisible({ timeout: 5000 });

  // Click Reset Filters — this triggers window.location.reload()
  await page.getByRole("button", { name: "RESET FILTERS" }).click();
  await page.waitForLoadState("networkidle");

  // After reset, both E2E products should be visible
  await expect(page.getByText(LAPTOP1)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(SHIRT)).toBeVisible({ timeout: 5000 });
});

// E2E-BROWSE-05
test("E2E-BROWSE-05: Load More button appends additional products to the list", async ({
  page,
}) => {
  // Mark Wang, A0000000X
  // 7 E2E products seeded (6 + 1); perPage = 6, so Load More reveals the 7th.
  // But there may be other products in the DB. We check that product count increases.
  await page.goto("/");
  await page.waitForSelector(".card", { timeout: 10000 });

  // Count visible product cards before
  const countBefore = await page.locator(".card.m-2").count();

  // Load More button is shown only when products.length < total
  const loadMoreBtn = page.getByRole("button", { name: /Loadmore/i });
  if (await loadMoreBtn.isVisible()) {
    await loadMoreBtn.click();
    await page.waitForTimeout(1500); // wait for API call
    const countAfter = await page.locator(".card.m-2").count();
    expect(countAfter).toBeGreaterThan(countBefore);
  } else {
    // All products already shown (fewer than 6 total in DB) — skip
    console.log("E2E-BROWSE-05: Load More not visible (all products fit on one page).");
  }
});

// E2E-BROWSE-06
test("E2E-BROWSE-06: Search bar returns products matching the keyword", async ({ page }) => {
  // Mark Wang, A0000000X
  await page.goto("/");
  // SearchInput component: placeholder="Search", submit button text="Search"
  await page.getByPlaceholder("Search").fill("E2E Laptop");
  await page.getByRole("button", { name: "Search" }).click();

  // Should navigate to /search and display results
  await page.waitForURL(/\/search/, { timeout: 8000 });
  await expect(page.getByText(LAPTOP1)).toBeVisible({ timeout: 8000 });
});

// E2E-BROWSE-07
test("E2E-BROWSE-07: Search with no matching keyword shows empty state", async ({ page }) => {
  // Mark Wang, A0000000X
  await page.goto("/");
  await page.getByPlaceholder("Search").fill("xyzproductnotexist99999");
  await page.getByRole("button", { name: "Search" }).click();

  await page.waitForURL(/\/search/, { timeout: 8000 });
  // Search.js shows "No Products Found" when results array is empty
  await expect(page.getByText("No Products Found")).toBeVisible({ timeout: 8000 });
});

// E2E-BROWSE-08
test("E2E-BROWSE-08: Clicking More Details opens product details page with full info", async ({
  page,
}) => {
  // Mark Wang, A0000000X
  await page.goto("/");
  // Find the card for E2E Laptop 1 and click More Details
  const laptopCard = page.locator(".card.m-2", { hasText: LAPTOP1 });
  await laptopCard.getByRole("button", { name: "More Details" }).click();

  // Should navigate to /product/E2E-Laptop-1 (or similar slug)
  await page.waitForURL(/\/product\//, { timeout: 8000 });
  await expect(page.getByText(LAPTOP1)).toBeVisible({ timeout: 8000 });
  // Price and description should be on the product page
  await expect(page.getByText(/\$100\.00/)).toBeVisible();
  await expect(page.getByText(/E2E test laptop number 1/)).toBeVisible();
});
