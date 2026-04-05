// Lim Jun Xian A0259094U
import { test, expect } from '@playwright/test';
import { E2E_PREFIX } from "./helpers/globalSetup.js";

const ELECTRONICS = `${E2E_PREFIX}Electronics`;
const CLOTHING = `${E2E_PREFIX}Clothing`;
const LAPTOP1 = `${E2E_PREFIX}Laptop 1`;
const BLUESHIRT = `${E2E_PREFIX}Blue Shirt`;
const GREENSHIRT = `${E2E_PREFIX}Green Shirt`;

test.beforeEach(async ({ context, page }) => {
    // Clear localStorage, sessionStorage, cookies, cache
    await context.clearCookies();
    await context.clearPermissions();

    // Navigate to the page
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Clear localStorage inside the page
    await page.evaluate(() => {
        localStorage.clear();
    });

    await page.waitForLoadState('networkidle');
});

test.describe('Add product to cart succesfully while navigating from', () => {
    test('Home Page -> Product Details Page -> Cart Page', async ({ page }) => {
        // Filter products by category
        await page.locator(".filters .ant-checkbox-wrapper", { hasText: ELECTRONICS }).click();
        await page.locator(".filters .ant-checkbox-wrapper", { hasText: CLOTHING }).click();
        await page.waitForLoadState("networkidle");

        // Expect only relevant products to show
        await expect(page.getByText(LAPTOP1)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(BLUESHIRT)).toBeVisible({ timeout: 5000 });

        // Uncheck category, products related to category should not be displayed
        await page.locator(".filters .ant-checkbox-wrapper", { hasText: ELECTRONICS }).click();
        await expect(page.getByRole('heading', { name: LAPTOP1 })).not.toBeVisible({ timeout: 5000 });

        // Filter products by price
        await page.locator(".filters .ant-radio-wrapper", { hasText: '$0 to 19' }).click();

        // Expect only products that fulfills filter are shown
        await expect(page.getByRole('heading', { name: GREENSHIRT })).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(BLUESHIRT)).not.toBeVisible({ timeout: 5000 });

        // Go to product details page
        await page.getByRole('button', { name: 'More Details' }).first().click();
        await page.waitForURL(/\/product\//, { timeout: 8000 });
        // Wait for page to fully load and product data to be displayed
        await page.waitForLoadState("networkidle");
        await page.waitForLoadState("domcontentloaded");

        // Ensure the ADD TO CART button is visible and interactive
        const addButton = page.getByRole('button', { name: 'ADD TO CART' });
        await addButton.first().waitFor({ state: 'visible', timeout: 5000 });
        // Also wait for at least one h6 (product details) to be visible
        await page.locator('h6').first().waitFor({ state: 'visible', timeout: 5000 });

        // Add product to cart
        await addButton.first().click();
        await expect(page.getByText('Item Added to cart')).toBeVisible();

        // Go to cart page and check if the product is added successfully
        await page.getByRole('link', { name: 'Cart' }).click();
        await page.waitForURL('/cart', { timeout: 8000 });
        await page.waitForLoadState("domcontentloaded");
        await page.waitForLoadState('networkidle');
        // The text may include "please login to checkout!" when not authenticated
        await expect(page.getByText(/You Have 1 items in your cart/)).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('main')).toContainText(GREENSHIRT);
    });

    test('Categories Page -> Category Product Page -> Cart Page', async ({ page }) => {
        // Navigate to Categories Page through Header
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'All Categories' }).click();
        await page.waitForURL(/\/categories/, { timeout: 8000 });

        // Navigate to Category Product Page by clicking on a category
        await page.getByRole('link', { name: CLOTHING }).click();
        await page.waitForURL(/\/category\//, { timeout: 8000 });

        // Expect only relevant products to show
        await expect(page.getByRole('heading', { name: GREENSHIRT })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('heading', { name: LAPTOP1 })).not.toBeVisible({ timeout: 5000 });

        // Add prodcut to cart
        const greenShirtCard = await page.locator(".card.m-2", { hasText: GREENSHIRT });
        await greenShirtCard.getByRole("button", { name: "ADD TO CART" }).click();
        await expect(page.getByText('Item Added to cart')).toBeVisible();

        // Go to cart page and check if the product is added successfully
        await page.getByRole('link', { name: 'Cart' }).click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(/You Have 1 items in your cart/)).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('main')).toContainText(GREENSHIRT);
    });
});
