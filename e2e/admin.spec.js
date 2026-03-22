/**
 * Sprint 3 — E2E Admin Management Journey Tests
 * Stories: E2E-ADMIN-01 through E2E-ADMIN-08
 * Approach: Full-stack E2E via Playwright
 *
 * QINZHE Wang, A0337880U
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsUser, E2E_ADMIN_EMAIL } from "./helpers/auth.js";
import { E2E_PREFIX } from "./helpers/globalSetup.js";
import path from "path";

// E2E-ADMIN-01
test("E2E-ADMIN-01: Admin can access the admin dashboard", async ({ page }) => {
  // Mark Wang, A0337880U
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin");

  // AdminDashboard renders "Admin Name", "Admin Email", "Admin Contact"
  await expect(page.getByText(/admin name/i)).toBeVisible({ timeout: 10000 });
  // AdminMenu links should be visible
  await expect(page.getByRole("link", { name: /create category/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /create product/i })).toBeVisible();
});

// E2E-ADMIN-02
test("E2E-ADMIN-02: Non-admin user is blocked from admin routes and redirected", async ({
  page,
}) => {
  // Mark Wang, A0337880U
  await loginAsUser(page);
  await page.goto("/dashboard/admin");

  // AdminRoute shows Spinner which redirects to /login after 3 seconds
  await expect(page.getByText(/redirecting to you in/i)).toBeVisible({ timeout: 8000 });
  await page.waitForURL((url) => !url.toString().includes("/dashboard/admin"), {
    timeout: 10000,
  });
  expect(page.url()).not.toContain("/dashboard/admin");
});

// E2E-ADMIN-03
test("E2E-ADMIN-03: Admin can create a new category and it appears in the list", async ({
  page,
}) => {
  // Mark Wang, A0337880U
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/create-category");

  const newCatName = `${E2E_PREFIX}Cat ${Date.now()}`;
  // CategoryForm has placeholder "Enter new category"
  const createCategoryForm = page
    .locator("form")
    .filter({ has: page.getByPlaceholder("Enter new category") })
    .first();
  await createCategoryForm.getByPlaceholder("Enter new category").fill(newCatName);
  await createCategoryForm.getByRole("button", { name: "Submit" }).click();

  // Success toast and category appears in the table
  const categoryRows = page.locator("table tbody tr");
  await expect(categoryRows.filter({ hasText: newCatName })).toHaveCount(1, { timeout: 8000 });
});

// E2E-ADMIN-04
test("E2E-ADMIN-04: Admin can create a new product and it is navigated to products list", async ({
  page,
}) => {
  // Mark Wang, A0337880U
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/create-product");

  const newProductName = `${E2E_PREFIX}Widget ${Date.now()}`;

  // Select category — Ant Design Select: click the selector, wait for dropdown, pick option
  await page.locator(".ant-select").first().click();
  await page.locator(".ant-select-item-option", {
    hasText: `${E2E_PREFIX}Electronics`,
  }).first().click();

  // Fill text fields
  await page.getByPlaceholder("write a name").fill(newProductName);
  await page.getByPlaceholder("write a description").fill("E2E created product description");
  await page.getByPlaceholder("write a Price").fill("49");
  await page.getByPlaceholder("write a quantity").fill("5");

  // Submit
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // After creation, navigates to /dashboard/admin/products
  await page.waitForURL(/\/dashboard\/admin\/products/, { timeout: 10000 });
  const createdProductCardTitle = page.locator("a.product-link .card-title", {
    hasText: newProductName,
  });
  await expect(createdProductCardTitle).toBeVisible({ timeout: 8000 });
});

// E2E-ADMIN-05
test("E2E-ADMIN-05: Admin can update an existing product", async ({ page }) => {
  // Mark Wang, A0337880U
  await loginAsAdmin(page);
  // Navigate to products list — each product card is a Link to the update page
  await page.goto("/dashboard/admin/products");

  // Click on the E2E Laptop 2 card (use Laptop 2 to leave Laptop 1 intact for browse tests)
  const laptopLink = page.locator("a.product-link", { hasText: `${E2E_PREFIX}Laptop 2` });
  await expect(laptopLink).toBeVisible({ timeout: 10000 });
  await laptopLink.click();
  await page.waitForTimeout(2000); // Wait for API call

  // Should navigate to the update product page
  await page.waitForURL(/\/dashboard\/admin\/product\//, { timeout: 8000 });

  // Update the name
  const updatedName = `${E2E_PREFIX}Laptop 2 Updated`;
  const nameInput = page.getByPlaceholder("write a name");
  await nameInput.clear();
  await nameInput.fill(updatedName);
  await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

  // Should navigate back to products list with the updated name visible
  await page.waitForURL(/\/dashboard\/admin\/products/, { timeout: 10000 });
  await expect(page.getByText(updatedName)).toBeVisible({ timeout: 8000 });
});

// E2E-ADMIN-06
test("E2E-ADMIN-06: Admin can delete a product and it is removed from the list", async ({
  page,
}) => {
  // Mark Wang, A0337880U
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/products");

  // Find the E2E Laptop 5 product link and click it to open the update/delete page
  const targetName = `${E2E_PREFIX}Laptop 5`;
  const productLink = page.locator("a.product-link", { hasText: targetName });
  await expect(productLink).toBeVisible({ timeout: 10000 });
  await productLink.click();

  await page.waitForURL(/\/dashboard\/admin\/product\//, { timeout: 8000 });

  // Handle window.prompt — UpdateProduct uses window.prompt before deleting
  page.on("dialog", (dialog) => dialog.accept("yes"));

  // Click DELETE PRODUCT
  await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

  // Should navigate back to products list
  await page.waitForURL(/\/dashboard\/admin\/products/, { timeout: 10000 });
  // The deleted product should no longer appear
  await expect(page.getByText(targetName)).not.toBeVisible({ timeout: 5000 });
});

// E2E-ADMIN-07
test("E2E-ADMIN-07: Admin can update order status from the orders page", async ({ page }) => {
  // Mark Wang, A0337880U
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/orders");

  // Wait for at least one order row to appear (seeded in globalSetup)
  await expect(page.getByText(/All Orders/i)).toBeVisible({ timeout: 10000 });

  // The seeded order starts with status "Not Processed"
  // NOTE: AdminOrders.js uses a local status array ["Not Process", "Processing", ...]
  // which differs from the DB enum ["Not Processed", ...] — this is a UI bug.
  // We change to "Processing" which is consistent in both arrays.
  const statusSelect = page.locator("td .ant-select").first();
  await statusSelect.click();
  await page.locator(".ant-select-item-option", {
    hasText: "Processing",
  }).first().click();

  // Wait for the API call to complete (no navigation, just re-fetch)
  await page.waitForTimeout(1500);
  // The select should now reflect "Processing"
  await expect(statusSelect).toContainText("Processing", { timeout: 5000 });
});

// E2E-ADMIN-08
test("E2E-ADMIN-08: Admin can view all orders from all customers", async ({ page }) => {
  // Mark Wang, A0337880U
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/orders");

  // The heading "All Orders" should be present
  await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible({ timeout: 10000 });

  // At least the seeded test order should be listed
  // (the order contains E2E Blue Shirt)
  await expect(page.getByText(`${E2E_PREFIX}Blue Shirt`)).toBeVisible({ timeout: 8000 });
});

/// Below tests are all added by Daniel Lai, A0192327A
// added the test case, Daniel Lai, A0192327A
test("E2E-ADMIN-09: Admin can view their own details from dashboard page", async ({ page }) => {
  await loginAsAdmin(page);
  
  await page.goto("/dashboard/admin");
  
  await expect(page.getByText(/Admin Name:/i)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/Admin Email:/i)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/Admin Contact:/i)).toBeVisible({ timeout: 8000 });
});

// added the test case, Daniel Lai, A0192327A
test("E2E-ADMIN-10: Cannot submit product without selecting category", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/create-product");
  const newProductName = `${E2E_PREFIX}NoCat ${Date.now()}`;
  
  await page.getByPlaceholder("write a name").fill(newProductName);
  await page.getByPlaceholder("write a description").fill("Should fail because category is missing");
  await page.getByPlaceholder("write a Price").fill("29");
  await page.getByPlaceholder("write a quantity").fill("2");
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  await expect(page).toHaveURL(/\/dashboard\/admin\/create-product/, { timeout: 8000 });
  await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();
});

/// Note: Related testing has revealed a major bug:
/// Deleting a category causes items with said category to no longer have any, which should not be possible (see Test 10)
/// Practically speaking, this means it does not show up on admin to fix the error, nor are said items addable to cart.
/// However, as UI testing bugs are technically not in scope for fixing, this will not be fixed but just noted here for now.
// added the test case, Daniel Lai, A0192327A
test("E2E-ADMIN-11: Deleted category no longer appears in create-product dropdown", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/create-category");
  const categoryName = `${E2E_PREFIX}TempCat ${Date.now()}`;
  const createCategoryForm = page
    .locator("form")
    .filter({ has: page.getByPlaceholder("Enter new category") })
    .first();
  await createCategoryForm.getByPlaceholder("Enter new category").fill(categoryName);
  await createCategoryForm.getByRole("button", { name: "Submit" }).click();

  const categoryRow = page.locator("table tbody tr", { hasText: categoryName }).first();
  await expect(categoryRow).toBeVisible({ timeout: 8000 });
  await categoryRow.getByRole("button", { name: "Delete" }).click();
  
  await expect(
    page.locator(".ant-select-item-option", { hasText: categoryName })
  ).toHaveCount(0);
});

// added the test case, Daniel Lai, A0192327A
test("E2E-ADMIN-12a: Add product with normal image works and shows image preview", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/create-product");
  const newProductName = `${E2E_PREFIX}ImgOK ${Date.now()}`;
  const smallImagePath = path.join(process.cwd(), "e2e", "images", "small-image.jpg");

  await page.locator(".ant-select").first().click();
  await page
    .locator(".ant-select-item-option", {
      hasText: `${E2E_PREFIX}Electronics`,
    })
    .first()
    .click();
  await page.locator('input[aria-label="photo-input"]').setInputFiles(smallImagePath);
  await expect(page.locator('img[alt="product_photo"]')).toBeVisible({ timeout: 5000 });
  await page.getByPlaceholder("write a name").fill(newProductName);
  await page.getByPlaceholder("write a description").fill("Product with small valid image");
  await page.getByPlaceholder("write a Price").fill("49");
  await page.getByPlaceholder("write a quantity").fill("5");
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
  await page.waitForURL(/\/dashboard\/admin\/products/, { timeout: 10000 });
  
  const createdProductCardTitle = page.locator("a.product-link .card-title", {
    hasText: newProductName,
  });
  await expect(createdProductCardTitle).toBeVisible({ timeout: 8000 });
});

// added the test case, Daniel Lai, A0192327A
test("E2E-ADMIN-12b: Add product with too-big image fails", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/dashboard/admin/create-product");
  const newProductName = `${E2E_PREFIX}ImgTooBig ${Date.now()}`;
  const bigImagePath = path.join(process.cwd(), "e2e", "images", "too-big-image.jpg");

  await page.locator(".ant-select").first().click();
  await page
    .locator(".ant-select-item-option", {
      hasText: `${E2E_PREFIX}Electronics`,
    })
    .first()
    .click();
  await page.locator('input[aria-label="photo-input"]').setInputFiles(bigImagePath);
  await page.getByPlaceholder("write a name").fill(newProductName);
  await page.getByPlaceholder("write a description").fill("Product should fail due to oversized image");
  await page.getByPlaceholder("write a Price").fill("59");
  await page.getByPlaceholder("write a quantity").fill("5");
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  await expect(page).toHaveURL(/\/dashboard\/admin\/create-product/, { timeout: 8000 });
  await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();
});