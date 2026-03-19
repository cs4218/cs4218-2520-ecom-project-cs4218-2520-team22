import { test, expect } from '@playwright/test';

const BASE_URL = "http://localhost:3000";

test.beforeEach(async ({ context, page }) => {
    // Clear localStorage, sessionStorage, cookies, cache
    await context.clearCookies();
    await context.clearPermissions();

    // Navigate to the page
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Clear localStorage inside the page
    await page.evaluate(() => {
        localStorage.clear();
    });

    await page.waitForTimeout(1000);
});

test.describe('Add product to cart succesfully while navigating from', () =>  {
    test('Home Page -> Product Details Page -> Cart Page', async ({ page }) => {
        // Filter products by category
        await page.locator(".filters .ant-checkbox-wrapper").filter({ hasText: 'Book' }).click();
        await page.waitForTimeout(1000);
        await page.locator(".filters .ant-checkbox-wrapper").filter({ hasText: 'Clothing' }).click();
        await page.waitForTimeout(1000);

        // Expect only relevant products to show
        await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('heading', { name: 'Smartphone' })).not.toBeVisible({ timeout: 5000 });
        
        // Uncheck category, products related to category should not be displayed
        await page.locator(".filters .ant-checkbox-wrapper").filter({ hasText: 'Clothing' }).click();
        await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).not.toBeVisible({ timeout: 5000 });

        // Filter products by price
        await page.locator(".filters .ant-radio-wrapper").filter({ hasText: '$0 to 19' }).click();
        await page.waitForTimeout(1000);

        // Expect only products that fulfills filter are shown
        await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Textbook')).not.toBeVisible({ timeout: 5000 });

        // Go to product details page
        await page.getByRole('button', { name: 'More Details' }).first().click();
        await page.waitForTimeout(2000);

        // Add prodcut to cart
        await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
        await expect(page.getByText('Item Added to cart')).toBeVisible();

        // Go to cart page and check if the product is added successfully
        await page.getByRole('link', { name: 'Cart' }).click();
        await expect(page.getByRole('main')).toContainText('Novel');
    });

    test('Categories Page -> Category Product Page -> Cart Page', async ({ page }) => {
        // Navigate to Categories Page through Header
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'All Categories' }).click();
        await page.waitForTimeout(1000);

        // Navigate to Category Product Page by clicking on a category
        await page.getByRole('link', { name: 'Book' }).click();
        await page.waitForTimeout(1000);

        // Expect only relevant products to show
        await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).not.toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('heading', { name: 'Smartphone' })).not.toBeVisible({ timeout: 5000 });

        // Add prodcut to cart
        await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
        await expect(page.getByText('Item Added to cart')).toBeVisible();

        // Go to cart page and check if the product is added successfully
        await page.getByRole('link', { name: 'Cart' }).click();
        await expect(page.getByText(/You Have 1 items in your cart/)).toBeVisible({ timeout: 5000 });
    });
});
